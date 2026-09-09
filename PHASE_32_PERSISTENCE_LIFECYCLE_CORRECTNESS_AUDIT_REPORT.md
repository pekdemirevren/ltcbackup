# PHASE 32 — PERSISTENCE LIFECYCLE CORRECTNESS AUDIT REPORT

## Phase 32 Scope

Bu fazın amacı uygulamanın persistence + app lifecycle + workout recovery davranışını uçtan uca denetlemekti.

Denetlenen zincir:

- Workout Start
- runtime state oluşumu
- Timer çalışması
- set / rep / progress state
- background / foreground
- navigation değişimi
- workout completion veya abandon
- persistence
- app restart
- state restoration / hydration
- completion
- historical snapshot
- Summary / History / Progress

Bu audit yeni feature geliştirme değil; mevcut lifecycle ve persistence contract'ının doğru davranıp davranmadığını kanıtlamayı amaçlar.

## Repository Areas Audited

Öncelikli olarak aşağıdaki alanlar tarandı:

- `src/contexts/TimerContext.tsx`
- `src/screens/TimerScreen.tsx`
- `src/utils/MainCardAttemptManager.ts`
- `src/utils/MainCardEngine.ts`
- `src/utils/WorkoutSettingsManager.ts`
- `src/utils/SessionSnapshotReader.ts`
- `src/utils/SnapshotCalorieReader.ts`
- `src/screens/WorkoutSummaryScreen.tsx`
- `src/screens/SummaryScreen2.tsx`
- `src/screens/DailySummaryDetailScreen.tsx`
- `src/screens/TrendsScreen.tsx`
- `src/screens/ProgressionTrendScreen.tsx`
- `src/navigation/RootNavigator.tsx`
- `App.tsx`
- `@workout_calendar_events` / calendar event persistence
- AsyncStorage key setleri için `workoutSummaries`, `main_card_state_*`, `@last_activity_workout_id`, settings keys, user weight, calendar events

## Workout Lifecycle

Uygulamanın gerçek üretim lifecycle'ı aşağıdaki gibi çalışıyor:

1. `TimerContext` workout başlatma çağrısıyla `timerKey` arttırır ve `navigation.navigate('Timer', params)` çağırır.
2. `TimerScreen` yerel runtime state'i oluşturur ve `timerKey`/`workoutId` değiştiğinde reset yapar.
3. Timer arka plan, foreground, app kapatma veya navigation değişimi sırasında aktif session state'i persist edilmez.
4. Yalnızca workout completion anında `saveWorkoutSummary` çağrılır.
5. `saveWorkoutSummary` tamamlanmış session için `workoutSummaries` içine immutable historical snapshot yazar.
6. History / Summary / Trend ekranları bu persisted snapshot'ı okur.

Bu, uygulamanın active timer restore protocol'ü değil; completed historical truth protocol'üdür.

## Persistence Ownership

### Timer persistence

`TimerContext` temel ayarları AsyncStorage üzerinden saklar; ama çalışan timer state'i değil.

- ayarlar: `greenTime`, `redTime`, `greenReps`, `redReps`, `greenCountdownSpeed`, `redCountdownSpeed`, `infiniteLoopTime`, `infiniteSpeed`, `wallpaper`, `weight`
- aktif workout runtime: yok
- restore/hydration: yok
- background resume: yok

### Active workout state

`TimerScreen` local state içinde çalışır:

- `count`
- `completedGreenReps`
- `completedRedReps`
- `totalElapsedTime`
- `greenLoopTimesRef`
- `redLoopTimesRef`
- `currentLoopStartTimeRef`
- `workoutFinishedRef`

Bu state, ekranın mount ömrü ile sınırlıdır. AsyncStorage'de aktif workout state'i yoktur.

### Workout summaries / session snapshots

Tamamlanmış session'lar `workoutSummaries` altında saklanır.

`TimerScreen.saveWorkoutSummary` içinde:

- `bodyWeightKg` çözümlenir
- `calories` hesaplanır
- `elapsedTime`, `completedSets`, `completedReps`, `totalVolume`, `greenLoopTimes`, `redLoopTimes` ve snapshot alanları yazılır
- `AsyncStorage.setItem('workoutSummaries', JSON.stringify(summaries))` çalışır

Böylece completed historical truth oluşur.

### MainCardAttemptManager / processedAttemptIds

`src/utils/MainCardAttemptManager.ts` ve `src/utils/MainCardEngine.ts` main-card flow için idempotent attempt processing yapar.

- `main_card_state_<cardId>` state saklar
- `processedAttemptIds` ile aynı attempt'ın tekrar işlenmesini önler
- duplicate processing önlenir

Bu mekanizma completed run lifecycle için vardır; active timer restore için değil.

## AppState / Background Behavior

Bu kod tabanında `AppState` kullanımı yoktur.

Ayrıca `App.tsx` içinde lifecycle listener / background resume / foreground restore / hydration logic bulunmuyor.

Bu, gerçekten önemli bir nokta:

- app background'a alındığında timer runtime state'in korunması için bir mekanizma yok,
- app yeniden açıldığında bu state'i restore eden bir hydration yok,
- dolayısıyla in-progress workout'un resume davranışı yok.

Bu davranış, üretim contract'ı olarak görünmüyor; çünkü tamamlanmamış workout'lar completed historical session'a dönüştürülmüyor. `TimerScreen`'da ayrıca "Save on unmount kaldırıldı: sadece workout tamamlandığında kayıt alınacak" notu vardır.

Bu nedenle background/foreground sırasında progress kaybı yaşamaya dair bug değil, "active session resume contract yok" olarak değerlendirilir.

## App Restart / Recovery

App restart sırasında aşağıdaki davranış görülüyor:

- `TimerContext` ayarları yeniden AsyncStorage'den yüklenir
- `WorkoutSettingsManager` workout settings'i yeniden yükler
- aktif timer bulunduğu ekran yeniden oluşturulur
- fakat in-progress workout state'i persist edilmediği için yeniden baştan başlar

Bu, `cold start` ile `warm navigation` farkı olarak görünür; ama completed history'ye zarar vermez.

Önemli olan nokta:

- açık olan workout'un runtime state'i historical truth'e dönüşmeden app restart ile kaybolabilir
- fakat tamamlanmamış workout, `saveWorkoutSummary` çağrısı olmadan completed historical snapshot olarak yazılmaz

Bu nedenle yanlış historical kayıt riski yoktur.

## Abandoned Workout Behavior

Kullanıcı `Start -> birkaç set -> Back / leave screen` davranışında kodun gerçek path'i şöyledir:

- `workoutFinishedRef.current` false iken `TimerScreen` tamamlanma dışındaki durumlarda save yapmaz
- `saveWorkoutSummary` yalnızca final set tamamlanınca çağrılır
- `TimerScreen`'daki yorum: "Save on unmount kaldırıldı"
- `workoutSavedRef` duplicate save'i önler

Sonuç:

- partial workout historical completed session olarak yazılmaz
- abandoned runtime state, unmount sırasında kaydedilmez
- sonraki workout'a stale runtime state sızmaz çünkü `TimerScreen` reset effect'i `timerKey` ve `workoutId` ile reset edilir

Bu sayede abandoned workflow düzgün davranır.

## Completion Boundary

Workout completion boundary, `TimerScreen` içinde şu şekilde işlenir:

- `count === -1` koşulunun ardından `cycleTrackingEnabled` için final set/rep kontrolü yapılır
- final set tamamlandığında `workoutFinishedRef.current = true`
- `setIsPaused(true)` ve `setGlobalIsPaused(true)`
- `saveWorkoutSummary(currentSetCount, currentRepCount)` çağrılır
- ardından `navigation.navigate('WorkoutSummaryScreen', ...)`

Böylece completion boundary net ve tek yönlüdür.

Duplicate save guard:

- `workoutSavedRef` ilk save öncesi set edilir
- aynı workout için tekrar save engellenir

Main-card attempt idempotency:

- `recordWorkoutInAttempt` içinde completedWorkouts dedupe edilir
- `MainCardEngine.processMainCardRun` içinde `processedAttemptIds` duplicate 처리 yapar

Dolayısıyla Phase 25 / Phase 26 / Phase 31 contract'larından gelen duplicate-save ve idempotency koruması sürüyor.

## Same-Workout Restart

Aynı workout template tekrar başlatma senaryosu:

- `Start A -> abandon/back -> Start A`
- `Start A -> complete -> Start A`

Bu iki senaryo için `TimerContext` `timerKey` arttırır ve `TimerScreen` reset effect'i `timerKey` değişimini dinler.

Bu, Phase 28 fix'i ile aynı workout tekrar başlatıldığında stale runtime state taşıma riskini en aza indirir.

Yinelenen çalışmalarda persist edilen historical truth değişmez; yalnızca yeni runtime session başlar.

## Persistence Race Analysis

Bu kodun gerçek path'lerinde `AsyncStorage` write/read race'ı için üretim bug üretmez.

Gözlenen durumlar:

- `saveWorkoutSummary` önce `workoutSavedRef` set eder, ardından read/write yapar
- `MainCardAttemptManager` `recordWorkoutInAttempt` sequential AsyncStorage read/write döngüsü kullanır
- `processedAttemptIds` dedupe, `completedWorkouts.includes` kontrolü ile korunur

Bu, re-entrant completion, duplicate save, birden fazla save çağrısı ve aynı attempt yeniden işlenmesi için uygun koruma sağlar.

Ancak burada önemli bir ayrım var:

- `AsyncStorage` üzerinde `in-progress timer state` yok
- bu nedenle timer pause/resume sırasında "stale closure + late write" gibi bir issue üretmez
- çünkü pending active session persistence yoktur

Yani race condition teorisi uygun görünse de, code path'te real persisted active session yoktur.

## Legacy / Migration Analysis

`WorkoutSettingsManager` ve `SessionSnapshotReader` legacy fallback mantığı içerir.

- `loadWorkoutSettings` default settings ile merge eder
- `SessionSnapshotReader` snapshot-first precedence uygular
- `SnapshotCalorieReader` snapshot calories varsa onu kullanır
- malformed/legacy recordlarda computed fallback çalışır

Bu migration kodu, historical truth contract'ını bozmaz. Aksine eski veriyi okurken snapshot-first/legacy fallback davranışını korur.

## Invalid / Partial Data Handling

Reader layer bu tür verileri güvenli şekilde yönetir:

- missing JSON: caught / default fallback
- empty arrays: safe handling
- missing timestamps: read path bekler, `new Date(s.date)` ile parse hatası durumunda try/catch içinde düşer
- missing workoutId: fallback with generated or safe default in save path
- zero values: valid numeric zero is explicitly handled because `Number.isFinite` / explicit finite checks kullanılır
- NaN / invalid numeric values: reader functions finite check ile filtrelenir
- duplicate IDs: `processedAttemptIds` dedupe
- partially written records: asenkron yazım sırasında valid `workoutSummaries` parse hatası catch ile clean fallback

Bu, production'ın gerçek usage modelinde persisted historical data'ya karşı güvenli bir boundary sağlar.

## Historical Truth

Bu uygulama için kritik kural şudur:

Completed historical workout authoritative snapshot'tır.

Aşağıdaki alanlar runtime veya current workout definition'tan yeniden hesaplanmamalıdır:

- calories
- total volume
- active time
- rest time
- completed sets
- completed reps
- strength / 1RM
- DSI
- OVR
- body-weight-dependent historical results

`SessionSnapshotReader` ve `SnapshotCalorieReader` bunu korur.

Bu contract, lifecycle olaylarına rağmen bozulmamıştır.

## Calendar Separation

Calendar/planned event persistence ile completed session persistence kesin şekilde ayrılmıştır.

- `@workout_calendar_events` calendar/planning
- `workoutSummaries` historical completion truth

Bu şekilde calendar data, historical session doğruluğunu etkilemez.

## Phase 25–31 Contract Verification

Phase 25–31'de inşa edilen ve korunan contract'lar doğrulandı:

- Historical Truth
- SessionSnapshotReader
- SnapshotCalorieReader
- processedAttemptIds
- MainCardAttemptManager
- MainCardEngine
- calculateOVR authority
- workout.baseStats
- XP / Level semantics
- persistence schema
- timerKey runtime consistency
- duplicate save guard
- attempt propagation
- same-day multi-event aggregation
- recurring event deduplication
- navigation ownership
- calendar/event ownership
- Phase 30 numerical integrity
- Phase 31 result pipeline integrity

Hiçbir önceki phase'de çözülen problem tekrar ortaya çıkmadı.

## Finding

Finding = `NO VALID PRODUCTION ISSUE FOUND`

Production Changes = `NONE`
Regression Test = `NONE REQUIRED`

## Severity

N/A — valid production issue bulunamadı.

## Evidence

1. `App.tsx` içinde `AppState` listener yoktur.
2. `TimerContext` aktif timer state persist etmez.
3. `TimerScreen` çözüm olarak `saveWorkoutSummary` sadece completed workout'ta çağırır.
4. `TimerScreen` yorumunda "Save on unmount kaldırıldı" yazmaktadır.
5. `workoutSavedRef` duplicate save guard korur.
6. `MainCardEngine.processMainCardRun` `processedAttemptIds` ile duplicate processing'i engeller.
7. `SessionSnapshotReader` ve `SnapshotCalorieReader` historical truth'i snapshot-first korur.
8. history / trends / summary screens persisted session verisini okur.

Bu evidence kodun lifecycle design'ının intentional olduğunu gösterir: in-progress session restore yok, historical snapshot yalnızca completion'da yazılır.

## Root Cause

Yok — geçerli production bug bulunamadı.

## Implementation

Yapılmadı — production code değişikliği yapılmadı.

## Regression Test

Gerekmiyor — bug bulunmadığı için focused regression test eklenmedi.

## Protected Contracts

- Historical Truth: korundu
- SessionSnapshotReader: korundu
- SnapshotCalorieReader: korundu
- processedAttemptIds: korundu
- MainCardAttemptManager: korundu
- MainCardEngine: korundu
- calculateOVR authority: korundu
- workout.baseStats: korundu
- XP / Level semantics: korundu
- persistence schema: korundu
- timerKey runtime consistency: korundu
- duplicate save guard: korundu
- attempt propagation: korundu
- calendar/event ownership: korundu

## Test Results

### TypeScript

Komut: `npx tsc --noEmit`
Sonuç: PASS

### Protected Jest suite

Komut: `npx jest --runInBand --testPathIgnorePatterns=__tests__/App.test.tsx`
Sonuç: 12/12 test suite PASS, 110/110 test PASS

### Full Jest smoke

Komut: `npx jest --runInBand`
Sonuç: 12/13 test suite PASS, 1 suite FAIL

Fail eden suite: `__tests__/App.test.tsx`
Hata: `RNGestureHandlerModule` bulunamadı

Bu hata üretim logic değil, test-harness / native environment issue'dır. Production koduna bu hatayı susturmak için müdahale edilmedi.

## Bugs Fixed

Yok.

## Deferred Findings

- In-progress timer state'i app kill / restart sırasında restore edilmez.
- Bu, completed historical truth contract'ı için sorun değildir; ancak app'in active-session resume semantics'i yoktur.
- Bu erhdeki durum, lifecycle recovery requirement'i olarak görülebilir ama mevcut uygulama contract'ına göre not a production bug.

## Remaining Technical Debt

- Eğer ürün gereksinimi active workout resume / recovery eklenirse, o zaman AppState + persisted active timer snapshot + hydration + rejoin semantics eklenmelidir.
- Bug olarak değil, feature olarak değerlendirilmelidir.

## Risk Assessment

Risk: LOW

Neden:

- No valid production bug found
- Historical truth is preserved
- Duplicate-save guard remains intact
- Reader contract remains snapshot-first
- Main-card idempotency remains intact
- Only full Jest failure is a native test harness issue unrelated to app logic

## Final Recommendation

- Production code changes: NONE
- Regression test: NONE REQUIRED
- Proje için mevcut lifecycle contract'ı, in-progress workout restore değil; completed historical snapshot persistence'tir.
- Bu contract, mevcut user-facing correctness ve historical integrity için kabul edilebilir ve kanıtlanmıştır.

Son değerlendirme:

NO VALID PRODUCTION ISSUE FOUND.
