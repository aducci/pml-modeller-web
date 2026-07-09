import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
// TODO: Connect process interface clicks to navigateToProcess in ProcessController
// TODO: Fetch linked process content when breadcrumb item is clicked
export const BreadcrumbBar = ({ trail, currentProcess, pinnedActor, processInterfacesOn, onNavigateTo, onUnpinActor, }) => {
    const maxVisible = 5;
    const visibleItems = trail.slice(-maxVisible);
    const hasOverflow = trail.length > maxVisible;
    return (_jsxs("div", { style: {
            height: 28,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E5E7EB',
            fontSize: 12,
            gap: 4,
        }, children: [_jsx("span", { style: { color: '#94A3B8', fontSize: 10 }, children: "\uD83D\uDDFA" }), hasOverflow && (_jsx("span", { style: { color: '#94A3B8', cursor: 'pointer', fontSize: 12 }, children: "\u2026" })), visibleItems.map((item, index) => {
                const actualIndex = trail.length - visibleItems.length + index;
                const isCurrent = index === visibleItems.length - 1 || item.processName === currentProcess;
                return isCurrent ? (_jsx("span", { style: {
                        color: '#1E293B',
                        fontWeight: 500,
                        cursor: 'default',
                    }, children: item.processName }, actualIndex)) : (_jsx("button", { onClick: () => onNavigateTo(actualIndex), style: {
                        background: 'none',
                        border: 'none',
                        color: '#6366F1',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: 12,
                    }, onMouseEnter: e => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#4338CA'; }, onMouseLeave: e => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#6366F1'; }, children: item.processName }, actualIndex));
            }), processInterfacesOn && (_jsx("span", { style: {
                    padding: '2px 8px',
                    fontSize: 10,
                    background: '#EEF2FF',
                    color: '#6366F1',
                    borderRadius: 4,
                }, children: "process interfaces on" })), pinnedActor && (_jsxs("span", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    fontSize: 10,
                    background: '#F1F5F9',
                    color: '#334155',
                    borderRadius: 4,
                    marginLeft: 'auto',
                }, children: [_jsx("span", { style: {
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#6366F1',
                        } }), pinnedActor, _jsx("button", { onClick: onUnpinActor, style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 16,
                            height: 16,
                            padding: 0,
                            border: 'none',
                            background: 'none',
                            borderRadius: 2,
                            cursor: 'pointer',
                            color: '#94A3B8',
                        }, onMouseEnter: e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }, onMouseLeave: e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94A3B8'; }, children: _jsx(X, { size: 10 }) })] }))] }));
};
