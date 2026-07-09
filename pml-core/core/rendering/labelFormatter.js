export function formatLabel(text, style, options = {}) {
    const { availableWidthPx, charWidthPx = 5.8 } = options;
    const ellipsis = style.ellipsis ?? '...';
    const source = style.uppercase ? text.toUpperCase() : text;
    if (!source)
        return { lines: [''], truncated: false };
    const maxLines = style.maxLines ?? 2;
    const maxCharsPerLine = availableWidthPx
        ? Math.max(4, Math.floor((availableWidthPx - 8) / charWidthPx))
        : 28;
    switch (style.wrap) {
        case 'truncate':
            return truncateSingleLine(source, maxCharsPerLine, ellipsis);
        case 'wrap':
            return wrapToLines(source, maxLines, maxCharsPerLine, ellipsis, true);
        case 'clamp':
        default:
            return clampToLines(source, maxLines, maxCharsPerLine, ellipsis);
    }
}
function truncateSingleLine(text, maxChars, ellipsis) {
    if (text.length <= maxChars)
        return { lines: [text], truncated: false };
    const truncated = text.slice(0, Math.max(0, maxChars - ellipsis.length)).trimEnd() + ellipsis;
    return { lines: [truncated], truncated: true };
}
function clampToLines(text, maxLines, maxChars, ellipsis) {
    if (text.length <= maxChars)
        return { lines: [text], truncated: false };
    // If text can fit on available lines, use word-wrap instead of clamping
    const totalCapacity = maxChars * maxLines;
    if (text.length <= totalCapacity) {
        return wrapToLines(text, maxLines, maxChars, ellipsis, true);
    }
    return wrapToLines(text, maxLines, maxChars, ellipsis, false);
}
function wrapToLines(text, maxLines, maxChars, ellipsis, forceWrap) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized)
        return { lines: [''], truncated: false };
    if (!forceWrap && normalized.length <= maxChars) {
        return { lines: [normalized], truncated: false };
    }
    const words = normalized.split(' ');
    // If we have enough line capacity for the whole text, use it without truncation
    if (maxLines > 1 && words.length > 1) {
        const totalCapacity = maxChars * maxLines;
        if (normalized.length <= totalCapacity) {
            // Greedy line fill: pack as many words as fit per line
            const resultLines = [];
            let current = '';
            for (const word of words) {
                const candidate = current ? `${current} ${word}` : word;
                if (candidate.length <= maxChars && resultLines.length < maxLines) {
                    current = candidate;
                }
                else {
                    if (current)
                        resultLines.push(current);
                    current = word;
                }
                if (resultLines.length >= maxLines)
                    break;
            }
            if (current && resultLines.length < maxLines) {
                resultLines.push(current);
            }
            return { lines: resultLines, truncated: false };
        }
    }
    const resultLines = [];
    let current = '';
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxChars) {
            current = candidate;
            continue;
        }
        if (!current) {
            resultLines.push(truncateWord(word, maxChars, ellipsis));
        }
        else {
            resultLines.push(current);
            current = word.length > maxChars ? truncateWord(word, maxChars, ellipsis) : word;
        }
        if (resultLines.length === maxLines)
            break;
    }
    if (resultLines.length < maxLines && current) {
        resultLines.push(current);
    }
    const consumed = resultLines.join(' ');
    const wasTruncated = consumed.length < normalized.length ||
        (resultLines.length === maxLines && words.length > resultLines.length);
    if (wasTruncated && resultLines.length > 0) {
        const lastIdx = resultLines.length - 1;
        const line = resultLines[lastIdx];
        if (line.length >= maxChars && !line.endsWith(ellipsis)) {
            resultLines[lastIdx] = line.slice(0, Math.max(0, maxChars - ellipsis.length)).trimEnd() + ellipsis;
        }
    }
    return { lines: resultLines.slice(0, maxLines), truncated: wasTruncated };
}
function truncateWord(word, maxChars, ellipsis) {
    if (word.length <= maxChars)
        return word;
    return word.slice(0, Math.max(0, maxChars - ellipsis.length)).trimEnd() + ellipsis;
}
export function toLetterSpacing(tracking) {
    if (tracking === 'wide')
        return '0.2px';
    if (tracking === 'wider')
        return '0.4px';
    return undefined;
}
