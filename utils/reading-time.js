const WORDS_PER_MINUTE = 200;

const readingMinutes = (text) => {
    const words = (typeof text === 'string' ? text.trim() : '').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

export { readingMinutes };