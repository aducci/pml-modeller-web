/**
 * Theme Preview Model
 *
 * A tiny, fixed PML sample used only by the admin Theme panel's live
 * preview canvas — deliberately exercises every themeable surface
 * (task, gateway/decision, subprocess, event, two lanes, a cross-lane
 * edge, and a loopback edge) in one small screen, so every control in
 * ThemePanel.tsx has something visible to change.
 *
 * Not a real process and never persisted — parsed fresh each time the
 * admin page loads, same as any other PML document.
 */
export const THEME_PREVIEW_PML = `@process L3 "Theme Preview"

event inbound_start as "Request Received" inbound
event outbound_end as "Response Sent" outbound

actor System
    subprocess run_checks as "Run Automated Checks" process=checks-v1

actor Reviewer
    task review_item as "Review Item"

    decision quality_check as "Quality Check":
        pass* > outbound_end
        fail  loop > review_item

flow key
    inbound_start > run_checks > review_item > quality_check
`;
