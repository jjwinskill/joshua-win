# View transitions in Chrome on iOS (as of 2026-10-31)

Why the page jumps about 95 pt in Chrome on iOS when a native cross-document transition starts, and what the site can do. Each claim is marked:

- **Source:** I read it in a spec, source file, doc or bug tracker, linked at the claim.
- **Observed:** Josh's recordings from a real iPhone on 2026-10-31.
- **Inferred:** my reasoning. Not proven.

**I ran nothing on a phone.** Nothing below is "tested" in the sense `route-transitions.md` uses it. Source was read at WebKit `49e831c` and Chromium `e3beebb`, both `main` on 2026-10-31, and Astro 7.4.4 in `node_modules`. The Chrome build on the phone may differ from Chromium `main`.

## Results from Josh's phone (2026-10-31)

These replace the original recommendation, which is kept below as written. Tested by Josh in Chrome on a real iPhone, and measured from his recordings.

| Build | Forward | Chrome's back arrow | Link to home |
|---|---|---|---|
| Native cross-document, with the morph | Jumps, then morphs | Jumps, then morphs | Not recorded |
| No view transition at all | Jumps | Jumps | Not recorded |
| `<ClientRouter />` | Morphs, no jump | Jumps up, then morphs, and stays on the site | Morphs, no jump |

**What this settles:**

- The jump comes from Chrome's cross-document navigation, not from the view transition. Skipping the transition can't fix it, so the skip below is ruled out.
- `<ClientRouter />` removes the jump everywhere except Chrome's own back arrow. Bug #18377, Back leaving the site, didn't appear in this one test. It could still appear in other cases.
- The back-arrow jump didn't reproduce in a test app with a `WKWebView` under fake bars, where the router's back morph was clean. That app did reproduce the native build's jump going back, but not going forward. So it's a partial model of Chrome, and something in Chrome's own back path is still unexplained.

**Tested in iOS 27.2 Simulator Safari:** `<ClientRouter />` morphs forward and back, with the same clipping above the toolbar as before.

**New recommendation, adopted as G34:** use `<ClientRouter />`, and report the back-arrow jump to Chromium with a minimal test page. It adds about 5.7 KB gzipped of router code to every page. The home page had no JS before.

## Original recommendation, before the phone results

**Don't build a router yet. Run the phone checks below first, because the first one decides which fixes can work at all.**

1. **Turn off `@view-transition` and tap around in Chrome on iOS.**
   - **The jump goes away:** ship the skip below, a few lines in the shared layout. Chrome on iOS gets a normal navigation and no morph. This is the proportionate fix.
   - **The jump stays:** view transitions aren't the cause, so skipping can't help. It's Chrome's navigation, and it would hit any multi-page site. Report it and leave it, unless the morph in this browser is worth the option in step 3.
2. **Report it to Chromium either way,** with a minimal test page. I found no public report (see "Is it known?").
3. **Don't use `<ClientRouter />` for this for now.** Its open bug hits exactly this browser: Back leaves the site in Chrome and Edge on iOS ([#18377](https://github.com/withastro/astro/issues/18377), fix [not merged](https://github.com/withastro/astro/pull/18408)). If same-document transitions are wanted in Chrome on iOS later, revisit it once that fix lands. A hand-written swap would have to re-solve most of what the router already does.

**The skip, untested.** Move the opt-in out of `site.css` and into the layout, so script can remove it before first render:

```html
<style is:inline id="vt-opt-in">
  @media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }
</style>
<script is:inline>
  if (/\bCriOS\//.test(navigator.userAgent)) document.getElementById('vt-opt-in').remove();
</script>
```

**Confidence:**

- High that same-document avoids a real code path that cross-document takes (source).
- Medium that the jump comes from Chrome resetting its insets when a load commits, not from where WebKit puts the snapshot. There are real gaps, listed below.
- Low on anything about the phone's Chrome build, because I can't see its flags.

**For the bake-off:** this is one browser's glitch, and #27 defines "works" as forward and back. The Next build's smoothness comes with no back morph at all (`route-transitions.md`). Whether this affects gate G29 is Josh's call.

## Phone checks, in order

Each takes a minute or two and needs no real code change.

| # | Do | If yes | If no |
|---|---|---|---|
| 1 | Chrome on iOS with `@view-transition` removed: does it still jump? | Not a view transition bug. Skipping won't help. | View transitions expose it. Skip works. |
| 2 | Safari with the address bar at the top: does it jump? | WebKit's snapshot geometry is the likely cause (bug 285400). | Points at Chrome's own code. |
| 3 | Chrome, from the very top of a page vs. scrolled partway down: is the jump only at the top? | Fits Chrome's reset, which moves the page only when it's at the top boundary. | Weakens that reading. |
| 4 | `chrome://version` (note the version and variations), then `chrome://flags#fullscreen-refactoring` set to Disabled, restart: is the jump gone? | Confirms the new inset path is needed for it. | That path isn't the cause, or `ChromeNextIa` is forcing it on. |
| 5 | Firefox and Edge on iOS, with a top bar: do they jump? | Decides whether more tokens join the skip. | Keep the skip to `CriOS`. |

Also worth one try: remove `html { scroll-behavior: smooth }` from `site.css`. I have no evidence it matters, but [bug 320346](https://bugs.webkit.org/show_bug.cgi?id=320346) shows smooth scrolling and transitions interact in WebKit.

## Is it known?

**No exact report found.** I searched WebKit Bugzilla (titles and comment text) and csswg-drafts, and the web for Chromium. `issues.chromium.org` couldn't be read directly, so a private or poorly worded crbug could exist. Three things come close.

**1. WebKit doesn't implement the snapshot containing block's insets. Open.**

- [Bug 285400](https://bugs.webkit.org/show_bug.cgi?id=285400), filed 2025-01. A WebKit engineer: "We don't currently implement the snapshot containing block", deprioritized because iOS's default bar is at the bottom, and it "does make more difference in single-tab mode" with a collapsible bar on top. That's the shape of Chrome on iOS. (Source)
- Bramus's cross-document demo there has the group's start position off after scrolling, "even in Tab Bar Mode". (Source)
- The code still says so: `// FIXME: Bug 285400 - Correctly account for insets.` in [`containingBlockRect()`](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/dom/ViewTransition.cpp#L1105). (Source)
- The fix, [PR 46108](https://github.com/WebKit/WebKit/pull/46108), has been open since 2025-05 and was last touched 2025-06. (Source)

**2. Chrome on iOS clears its insets during navigation. No bug title mentions transitions.**

- When a page changes, Chrome runs [`setObscuredInsets:UIEdgeInsetsZero`](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/web/web_state/ui/crw_web_controller.mm#L1953). (Source)
- It's called from [`webPageChangedWithContext`](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/web/navigation/crw_wk_navigation_handler.mm#L2724), reached from [`didCommitNavigation`](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/web/navigation/crw_wk_navigation_handler.mm#L1016). (Source)
- In the content-inset mode used on iOS 26+, [that zeroes `contentInset` and `obscuredContentInsets`, and moves the scroll offset too if the page is at its top boundary](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/web/web_state/ui/crw_web_view_content_view.mm#L453-L470). (Source)
- Moving the offset from `-inset` to `0` puts the page's top under the toolbar. That's an upward shift by the full inset, which would be about 95 pt here. (Inferred from the code. The 95 pt is Observed.)
- A Chromium commit describes this failure: pages load "pre-scrolled under the top toolbar" because "the raw scroll view's contentInset was reset to zero during navigation" ([a95286b](https://github.com/chromium/chromium/commit/a95286b402), relanded 2026-07-17, crbug 530905535). (Source)
- A third-party PR reports the same reset causing a shifted page after reload in Chrome on iOS ([midgard #1578](https://github.com/charliebeckstrand/midgard/pull/1578)). Its phone checks are unticked, so treat it as a lead. (Source, weak)

**3. Separate WebKit bugs for Safari's edges.** See the Safari section.

## Why cross-document differs from same-document

Mostly inferred. The code paths themselves are sourced.

| Step | Cross-document | Same-document |
|---|---|---|
| WebKit | A main-frame commit. `WKWebView` [marks view state to reset after the next layer tree](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebKit/UIProcess/API/ios/WKWebViewIOS.mm#L1005), [holds back visible-rect updates](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebKit/UIProcess/API/ios/WKWebViewIOS.mm#L3396) until then, then [resets the content offset](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebKit/UIProcess/API/ios/WKWebViewIOS.mm#L1373-L1376). The web process [forgets its visible rects](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebKit/WebProcess/WebPage/WebPage.cpp#L8814). | No commit, so none of this. (Source) |
| Chrome | The inset reset above, then a [re-apply on `didFinishNavigation`](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/chrome/browser/fullscreen/coordinator/fullscreen_mediator.mm#L256-L265), only for non-same-document navigations. | A `pushState` goes through [`URLDidChangeWithoutDocumentChange`](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/web/web_state/ui/crw_web_controller.mm#L1834), where I found no call to the reset. A [TODO](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/web/navigation/crw_wk_navigation_handler.mm#L2721) hints it may have been reached once. |
| Capture | Old state is captured in one document and [handed to the next](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/dom/ViewTransition.cpp#L145-L147), across that commit. (Source) | Both states come from one document with no commit between. (Source) |

The same-document case avoids all three, which fits the smooth Next build (Observed by Josh; Next's back doesn't morph at all, per `route-transitions.md`).

### Trying to disprove the hypothesis

The hypothesis was that a snapshot is positioned without accounting for insets. It's real as a WebKit gap, but it doesn't explain this jump well on its own. (All inferred, from sourced facts.)

- **Timing.** The containing block's rect is used for the whole transition, so a wrong rect should last the full 420 ms. The observed jump lasts 100 ms or less and ends before the morph starts.
- **Same-document uses the same rect.** [`containingBlockRect()`](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/rendering/updating/RenderTreeUpdaterViewTransition.cpp#L92-L96) is fixed at the top of the layout viewport in both modes. If the rect alone caused it, Next would jump too.
- **Safari.** It has a top inset for the status bar and shows no jump. Weak, since Safari sets insets through its own private path and I can't see its values.

### Gaps in the reset theory

- **Reset and re-apply run in the same callback in the normal path.** [`didCommitNavigation`](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/web/navigation/crw_wk_navigation_handler.mm#L1016-L1048) zeroes, then calls `OnNavigationFinished`, which restores. UIKit shouldn't paint between them. So something else must make it visible, and I couldn't find what. Candidates: [`setObscuredContentInsets`](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebKit/UIProcess/API/Cocoa/WKWebView.mm#L4063-L4066) changing view layout size in the web process, the first-commit offset reset above, or the `committedNavigation` branch, which [zeroes without an immediate finish](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/web/navigation/crw_wk_navigation_handler.mm#L999-L1007). The back path also wasn't fully traced.
- **It needs a flag.** The inset path above belongs to [`FullscreenMediator`](https://github.com/chromium/chromium/commit/a1b60ffda3), behind [`kFullscreenRefactoring` or `kChromeNextIa`, both disabled by default in source](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/chrome/browser/shared/public/features/features.mm#L978-L983). `ChromeNextIa` appears in [Chromium's testing config for iOS](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/testing/variations/fieldtrial_testing_config.json), which doesn't show the real rollout. Whether the phone has it on is unknown, so check 4 matters.
- **With the flag off, neither theory obviously applies.** The old path [resizes the web view's frame](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/chrome/browser/fullscreen/ui_bundled/fullscreen_web_view_resizer.mm#L100-L139), so WebKit may see no top inset at all. Its [comment](https://github.com/chromium/chromium/blob/e3beebb69f82f357b84953111eaa5f802c234191/ios/chrome/browser/fullscreen/ui_bundled/fullscreen_web_state_observer.mm#L76-L82) says `contentInset` "breaks the layout of fixed-position DOM elements", which is why normal pages used the frame. If the jump survives with the flag off, both theories here are wrong.
- **A plain navigation goes through the same reset.** If check 1 shows no jump without view transitions, something about the transition must expose it. I can't say what. Plain loads hold the old page until the new first paint, but that's from memory and I didn't trace it.

## Options

| Option | Would it fix the jump? | Cost | Verdict |
|---|---|---|---|
| Skip in Chrome on iOS | Yes, if check 1 says no jump without transitions. No otherwise. | A few lines. Loses the morph in one browser. Needs removing when fixed. | **First choice** |
| `<ClientRouter />` | Probably (same-document, like Next), but Back breaks in this browser | JS on every page, script and island rework | Not until #18408 lands |
| Hand-written swap | Probably, same reason | Rebuilds much of the router; ongoing upkeep | Last resort |
| CSS-only | No evidence any would work | Inner scroller costs a lot | No |

### `<ClientRouter />`

**How it works in 7.4.4 (Source: `node_modules/astro/dist/transitions/router.js`):**

- Fetches the page, parses it with `DOMParser`, and swaps inside `document.startViewTransition` (line 380).
- Handles `popstate` (line 460) and runs a transition for back and forward. If the browser already animated (`hasUAVisualTransition`, as in Safari's swipe), it swaps with no animation (line 377). [Astro's docs](https://docs.astro.build/en/guides/view-transitions/) say both directions animate.
- Uses `scrollTo` with `behavior: "instant"` (line 163), and sets `history.scrollRestoration = "manual"`.
- Bundled modules run once. Inline scripts with text it has already seen don't re-run unless marked `data-astro-rerun` (`swap-functions.js`, `deselectScripts`), so the `const syncMorphs` script won't throw on re-declaration.

**The blocker:** it calls `pushState` (line 149) after the fetch.

- [#18377](https://github.com/withastro/astro/issues/18377) (Chrome 155, iOS 27.2) reports that Back then leaves the site altogether in Chrome and Edge on iOS. (Source, third party's phone test)
- The WebKit half checks out: [`pushState` marks an entry when there's no recent user interaction](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/loader/HistoryController.cpp#L1105-L1106), and [the back list skips marked entries](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebKit/UIProcess/WebBackForwardList.cpp#L661-L714). (Source)
- One detail doesn't line up. [`hasRecentUserInteractionForNavigationFromJS`](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/dom/Document.cpp#L10013-L10024) allows 10 seconds from `lastActivationTimestamp`, while the report says activation is gone about 40 ms after a tap. Something in the embedder path must differ. I didn't resolve it, but the reported behavior has a long history ([#11919](https://github.com/withastro/astro/issues/11919)).
- [PR 18408](https://github.com/withastro/astro/pull/18408) fixes it by pushing during the click. It's open as of today.

**What else it would change here (Inferred, from the code):**

- `pageswap` and `pagereveal` don't fire for same-document transitions, so the off-screen morph guard in `Base.astro` would stop working. It'd move to `astro:before-preparation` and `astro:after-swap`.
- The parade is `client:idle` and exists only on essay pages. It would re-hydrate per swap unless persisted. Its `useEffect` cleanups need checking.
- `route-transitions.md` chose no `<ClientRouter />`, and that would need revisiting. JS ships to every page for every browser. It can't practically be loaded only for Chrome on iOS, since it's in the markup.

### Hand-written swap

**The sketch:** only when the UA has `CriOS`, intercept same-origin plain link clicks, fetch, then `startViewTransition(() => swap)`.

**Back: this is where it can beat React.**

- React's limit is React's own: a `startTransition` from `popstate` "must finish synchronously", so "React will skip animations from popstate" ([React](https://react.dev/reference/react/ViewTransition)). (Source)
- A hand-written `popstate` handler has no such rule. Astro's router already runs an async transition there. So it escapes React's limit. (Inferred, supported by Astro's code)
- The Navigation API is an option on iOS 26.2+ ([WebKit](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/), [caniuse](https://caniuse.com/mdn-api_navigation)). Its `handler` [runs after the URL commits](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/intercept), which may fix the entry-marking problem by committing during the click. No source says whether WebKit marks those entries. Older iOS would still need `popstate`, so `popstate` alone is simpler. (Source for support; the rest Inferred)
- It must call `pushState` synchronously in the click, as PR 18408 does, or it inherits the Back bug. (Inferred)

**The cost is the real problem (Inferred, unless linked):**

- Scripts in `DOMParser` documents don't run. Astro's island bootstrap and per-page module scripts need re-creating, which is what Astro's `runScripts()` (`router.js`, line 100) does. A page with no island may not have the `astro-island` definition at all.
- It must also handle per-page CSS such as `parade.css`, the title, focus, route announcement for screen readers, scroll restoration, and duplicates between pages' heads.
- The morph guard needs porting. Analytics may stop counting swapped pages. I didn't check how Cloudflare's beacon treats `pushState`.
- Every bug here would be specific to one browser that can't run in the Simulator. Any error should fall back to `location.assign`.

If the morph in Chrome on iOS is truly wanted, waiting for the `<ClientRouter />` fix is cheaper than this.

### CSS-only

No option here has evidence that it works. If the shift happens in the UI process's scroll view (see above), page CSS moves with it and can't offset it. (Inferred)

- **`::view-transition` positioning:** an offset would need the inset's size and the moment it changes, and the page can't read either. Issue [csswg #7859](https://github.com/w3c/csswg-drafts/issues/7859) covers the concept of offsets for retractable UI, but that's the browser's job. Rejected.
- **`viewport-fit=cover`:** WebKit [deliberately doesn't honor it for top and bottom in portrait, for web compatibility](https://bugs.webkit.org/show_bug.cgi?id=306465), as of 2026-08. (Source) Chrome's behavior under it wasn't checked. Worth no time.
- **`interactive-widget`:** it's about the on-screen keyboard. I found nothing connecting it to toolbars. No.
- **Inner scroller (`html, body { height: 100%; overflow: hidden }`):** this stops toolbar collapse, but it would make things worse under the reset theory, since the outer scroll view is then always at its top boundary, which is the only case where Chrome moves the offset. (Inferred) It also gives up browser scroll restoration and toolbar collapse, and the parade would have to read the inner scroller. Rejected.
- **`@view-transition` conditions:** [the rule can nest in `@media` and `@supports`, and the last rule wins](https://www.w3.org/TR/css-view-transitions-2/). (Source) No media or supports query identifies Chrome on iOS, so CSS can't target it. Script can, as in the skip.

### Skipping in the affected browser

**Why remove the rule rather than call `skipTransition()`:** [the rule is resolved in both the old and new documents](https://www.w3.org/TR/css-view-transitions-2/), so with no rule on either page no transition is set up at all. (Source) A rule appended from script risks not being last, because Astro's stylesheet links may follow it in the head, so the inline `<style>` plus `remove()` is safer. (Inferred, untested)

**Detection:**

| Browser | Token | Notes |
|---|---|---|
| Chrome | `CriOS/` | [Documented](https://github.com/chromium/chromium/blob/main/docs/ios/user_agent.md). Desktop-site mode keeps it. (Source) |
| Edge | `EdgiOS/` | [Listed by MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent). (Source) Closed source, so I don't know its shell. |
| Firefox | `FxiOS/` | No official doc found, and one [report](https://github.com/globalprivacycontrol/reference-server-express/issues/20) says the token can be missing. It [sets `obscuredContentInsets` too](https://github.com/mozilla-mobile/firefox-ios/blob/main/firefox-ios/Client/TabManagement/TabWebView.swift), so a WebKit cause could reach it. (Source for that call) |
| Brave | `Brave/1` or `Brave` | [On iOS since 1.78](https://github.com/brave/brave-browser/wiki/User-Agents); earlier builds look like Safari. No Client Hints on iOS. (Source) |

**Whether other iOS browsers are affected: unknown.** Sniff only what's seen to jump, so start with `CriOS` alone and add others after check 5. UA sniffing can't tell a fixed Chrome from a broken one, so it's a line to remove later. It also doesn't affect Safari, whose morph stays.

## Safari's edge pops

**The toolbar cut-off is a known bug and matches the source.**

- [Bug 325199](https://bugs.webkit.org/show_bug.cgi?id=325199) (iOS 26, open, same-document, on Chrome's own demo): a blank bar under the floating nav during the transition. [Bug 320238](https://bugs.webkit.org/show_bug.cgi?id=320238) (iOS 27, open) covers the top and bottom edges going solid. (Source)
- The spec says the snapshot containing block ["covers all areas of the window that could potentially display page content"](https://drafts.csswg.org/css-view-transitions-1/), including the URL bar. WebKit sizes it to [`visibleContentRectIncludingScrollbars()`](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/dom/ViewTransition.cpp#L1106), which on iOS is [the unobscured rect](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/platform/ScrollView.cpp#L353-L354). So yes, the snapshot stops above the toolbar. (Source; the link to this symptom is Inferred)
- Practical fixes are thin. Bug 320238's reporter found `:root { view-transition-name: none !important }` helped most, but that drops the root crossfade, and it was tried same-document only. One cheap try: put the page color on `html` as well as `body` so whatever shows in that strip matches. (Untested.) Otherwise accept it. PR 46108 is the real fix.

**`backdrop-filter` during the transition is also known.**

- [Bug 302256](https://bugs.webkit.org/show_bug.cgi?id=302256) (open): backdrop filters are disabled during view transitions in WebKit and Firefox, not in Chrome. (Source)
- Snapshots are [painted with `FlattenCompositingLayers`](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/dom/ViewTransition.cpp#L564). Backdrop blur needs live compositing, so it wouldn't survive inside a flattened root image. (Inferred) That matches the bar: see-through during the transition, solid after. (Observed)
- Giving the bar its own `view-transition-name` might help. The spec copies [old `backdrop-filter`](https://drafts.csswg.org/css-view-transitions-1/) to the group, and [WebKit copies it too](https://github.com/WebKit/WebKit/blob/49e831c38e05d4099861ea284b017a4a5603ad38/Source/WebCore/dom/ViewTransition.cpp#L1135). Bug 302256's report suggests it may still not render. (Untested)
- **Simplest fix:** make `--bar-background` in `parade.css` opaque and drop the blur. Nothing is left to pop. It's a visual choice, so it's Josh's.

## Couldn't find or do

- Run anything on a phone, or see the phone's Chrome version or variations.
- Open crbug 530905535 or search `issues.chromium.org`: the page returned only a sign-in prompt to my tools.
- What makes the reset visible, given the same-callback restore.
- The real field rollout of `FullscreenRefactoring` and `ChromeNextIa`.
- Which shell Edge on iOS uses.

## Sources checked on 2026-10-31

- [WebKit source at `49e831c`](https://github.com/WebKit/WebKit/tree/49e831c38e05d4099861ea284b017a4a5603ad38): `ViewTransition.cpp`, `viewTransitions.css`, `RenderTreeUpdaterViewTransition.cpp`, `ScrollView.cpp`, `WKWebViewIOS.mm`, `WKWebView.mm`, `WebPage.cpp`, `HistoryController.cpp`, `WebBackForwardList.cpp`, `Document.cpp`
- [Chromium source at `e3beebb`](https://github.com/chromium/chromium/tree/e3beebb69f82f357b84953111eaa5f802c234191): `ios/web/web_state/ui/`, `ios/web/navigation/`, `ios/chrome/browser/fullscreen/`, `features.mm`, `about_flags.mm`, `fieldtrial_testing_config.json`
- Chromium commits [a95286b](https://github.com/chromium/chromium/commit/a95286b402), [a1b60ff](https://github.com/chromium/chromium/commit/a1b60ffda3), [018c033](https://github.com/chromium/chromium/commit/018c033304), [3f26b71](https://github.com/chromium/chromium/commit/3f26b717f6)
- WebKit bugs [285400](https://bugs.webkit.org/show_bug.cgi?id=285400), [292970](https://bugs.webkit.org/show_bug.cgi?id=292970), [302256](https://bugs.webkit.org/show_bug.cgi?id=302256), [306465](https://bugs.webkit.org/show_bug.cgi?id=306465), [310016](https://bugs.webkit.org/show_bug.cgi?id=310016), [320238](https://bugs.webkit.org/show_bug.cgi?id=320238), [320346](https://bugs.webkit.org/show_bug.cgi?id=320346), [325199](https://bugs.webkit.org/show_bug.cgi?id=325199), and [PR 46108](https://github.com/WebKit/WebKit/pull/46108)
- [CSS View Transitions 1](https://drafts.csswg.org/css-view-transitions-1/), Editor's Draft of 2025-02-16 as served; [Level 2](https://www.w3.org/TR/css-view-transitions-2/), Working Draft of 2024-11-13; [csswg #7859](https://github.com/w3c/csswg-drafts/issues/7859)
- Astro 7.4.4 `dist/transitions/`, [Astro docs](https://docs.astro.build/en/guides/view-transitions/), [#11919](https://github.com/withastro/astro/issues/11919), [#18377](https://github.com/withastro/astro/issues/18377), [PR 18408](https://github.com/withastro/astro/pull/18408)
- [React: `<ViewTransition>`](https://react.dev/reference/react/ViewTransition)
- [WebKit features in Safari 26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/), [caniuse: Navigation API](https://caniuse.com/mdn-api_navigation), [MDN: `NavigateEvent.intercept`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/intercept), [MDN: User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent)
- [Chromium: iOS user agent](https://github.com/chromium/chromium/blob/main/docs/ios/user_agent.md), [Brave: User Agents](https://github.com/brave/brave-browser/wiki/User-Agents)
