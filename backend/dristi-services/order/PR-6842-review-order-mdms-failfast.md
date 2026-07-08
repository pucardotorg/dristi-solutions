# PR Review: #6842 — fail-fast on empty/failed MDMS data load in order service

- **PR:** https://github.com/pucardotorg/dristi-solutions/pull/6842
- **Issue:** https://github.com/pucardotorg/dristi/issues/5763
- **Scenario addressed:** https://github.com/pucardotorg/dristi/issues/5763#issuecomment-4901085522
- **File changed:** `backend/dristi-services/order/src/main/java/org/pucar/dristi/config/MdmsDataConfig.java`
- **Reviewed:** 2026-07-08

## Root cause (per issue comment 4901085522)

Duplicate hearings were created on July 2nd because one order-service pod had MDMS data loaded and a sibling pod didn't. The old `MdmsDataConfig` caught MDMS load failures, logged them, and moved on — leaving `nonOverlappingOrdersMdmsData` / `nonRepeatingOrdersMdmsData` / `itemTextMdmsData` `null` on the broken pod. `OrderRegistrationValidator.validateMdmsData` then NPE'd on those null lists and the resulting `CustomException` bubbled up — meaning the broken pod effectively couldn't run the duplicate-order validation at all, while still accepting traffic.

## What the PR does

`MdmsDataConfig.loadConfigData()` now throws `CustomException` (code `MDMS_DATA_LOAD_ERROR`) from each of the three loader methods when:
- the MDMS fetch/parse throws, or
- the result comes back empty (`CollectionUtils.isEmpty`).

Since this happens inside `@PostConstruct`, the exception fails Spring context startup, which fails the pod's readiness, so Kubernetes restarts it instead of letting it serve traffic without validation data. This is the correct shape of fix for the reported scenario — a broken pod now crash-loops instead of silently serving broken traffic.

## Correctness

Diff is small and correct:
- `objectMapper.readValue("")` (from `MdmsUtil.fetchMdmsData` returning `""` on failure) throws, caught and rewrapped as `CustomException` — verified this actually triggers under the observed failure mode.
- Empty-result check uses `CollectionUtils.isEmpty`, safe since each list is freshly initialized before the check.
- `CustomException(code, message)` usage matches existing convention in this module (e.g. `OrderRegistrationValidator`).

## Suggested improvements

1. **Deduplicate the three loader methods.** `loadNonOverlappingMdmsData`, `loadNonRepeatingOrdersMdmsData`, `loadItemTextMdmsData` now share an identical fetch → parse → catch-and-throw → empty-check-and-throw shape, differing only in field, master name, and target class. Collapse into one generic helper, e.g. `<T> List<T> loadMdmsMaster(String masterName, Class<T> clazz, String label)`, so the fail-fast policy lives in one place.

   **Expected fix:**
   ```java
   @PostConstruct
   public void loadConfigData() {
       nonOverlappingOrdersMdmsData = loadMdmsMasterData(configuration.getMdmsNonOverlappingOrders(), CompositeOrderMdms.class, "NonOverlappingOrdersMdmsData");
       nonRepeatingOrdersMdmsData = loadMdmsMasterData(configuration.getMdmsNonRepeatingCompositeOrders(), CompositeOrderMdms.class, "NonRepeatingOrdersMdmsData");
       itemTextMdmsData = loadMdmsMasterData(configuration.getMdmsItemText(), ItemTextMdms.class, "ItemTextMdmsData");
   }

   private <T> List<T> loadMdmsMasterData(String masterName, Class<T> targetClass, String label) {
       try {
           RequestInfo requestInfo = RequestInfo.builder().build();
           String mdmsDataResponse = mdmsUtil.fetchMdmsData(requestInfo, configuration.getTenantId(), configuration.getOrderModule(), List.of(masterName));
           MdmsResponse mdmsResponse = objectMapper.readValue(mdmsDataResponse, MdmsResponse.class);
           JSONArray mdmsData = mdmsResponse.getMdmsRes().get(configuration.getOrderModule()).get(masterName);

           List<T> result = new ArrayList<>();
           for (Object o : mdmsData) {
               result.add(objectMapper.convertValue(o, targetClass));
           }
           log.info("{} :: {}", label, result);

           if (CollectionUtils.isEmpty(result)) {
               log.error("{} loaded empty from MDMS", label);
               throw new CustomException(MDMS_DATA_LOAD_ERROR, label + " loaded empty from MDMS");
           }
           return result;
       } catch (CustomException ce) {
           throw ce;
       } catch (Exception e) {
           log.error("Unable to create {} :: {}", label, e.getMessage(), e);
           throw new CustomException(MDMS_DATA_LOAD_ERROR, "Unable to load " + label + " from MDMS: " + e.getMessage());
       }
   }
   ```
   This keeps the exact same fail-fast semantics (throw on fetch/parse error, throw on empty result) as the PR, removes ~40 duplicated lines down to one helper, and makes the three call sites in `loadConfigData()` read as a flat list of masters to load — easy to extend if a fourth master is added later. Note the `catch (CustomException ce) { throw ce; }` guard: without it, the generic `catch (Exception e)` would re-wrap the empty-result `CustomException` thrown inside the same try block into a second, differently-worded `CustomException`.

2. **Fail-fast on all three masters together, not just the first.** `loadConfigData()` runs the loaders sequentially, so the first failure aborts startup before the other two are attempted. If two masters are broken, that costs an extra restart cycle to discover the second. Consider running all three, collecting failures, and throwing one combined exception listing every broken/empty master.

3. **Consider a bounded retry before failing.** A single transient MDMS blip (e.g. a simultaneous rolling deploy of order-service and MDMS) now immediately fails the bean and hands recovery off to Kubernetes' CrashLoopBackOff, whose backoff grows exponentially (capped at 5 min). A couple of short in-process retries with a small delay before throwing would recover from transient startup races much faster.

4. **No test coverage added.** This is a safety-critical fail-fast path with no unit tests. Add tests that mock `MdmsUtil` to return an empty/garbage response and assert `CustomException` is thrown, so a future refactor can't silently reintroduce the swallow-and-log bug.

5. **Same anti-pattern exists elsewhere.** `hearing-management`, `epost-tracker`, and `analytics` all have their own `MdmsDataConfig` with the identical catch-and-log-only pattern. `hearing-management` in particular loads court-non-working-day/hearing MDMS data this way — the same "MDMS loaded on one pod, not another" scenario there could reproduce this exact duplicate-hearing bug through a different service. Worth a follow-up ticket to apply the same fail-fast treatment there, since this PR only closes the gap in `order`.

## Verdict

Not blocking — the core fix is correct and directly addresses the specific scenario from the issue (comment 4901085522). Items 1–4 are worth doing in this PR (small, cheap). Item 5 is a systemic follow-up, better tracked as a separate issue than folded into this PR's scope.

## Follow-up applied (2026-07-08)

- **Item 1 (deduplicate) — done.** The three loader methods are collapsed into one generic `loadMdmsMasterData(masterName, targetClass, label, failures)` helper; `loadConfigData()` now reads as a flat list of the three masters to load.
- **Item 2 (fail on all masters together) — done.** Each master is attempted regardless of earlier failures; failures are collected and a single `CustomException` lists every broken/empty master, so two broken masters are surfaced in one restart cycle instead of one at a time.
- **Item 4 (test coverage) — done.** Added `MdmsDataConfigTest` (4 tests, all passing): success path populates all getters; empty-string fetch response throws `MDMS_DATA_LOAD_ERROR`; empty master array throws; and the combined-failure message names all three masters.
- **Item 3 (bounded retry) — not applied.** Deliberately left out to avoid adding a `Thread.sleep`/retry-count config into `@PostConstruct` without a decision. Kubernetes CrashLoopBackOff already recovers transient startup races (at the cost of a slower first few restarts). Open as a separate improvement if faster transient recovery is wanted.
- **Item 5 (same anti-pattern in `hearing-management`/`epost-tracker`/`analytics`) — not applied.** Systemic; out of this PR's scope. Track as a separate ticket.