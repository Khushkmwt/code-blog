import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
});

const allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'p', 'a', 'ul', 'ol', 'li',
    'b', 'i', 'strong', 'em', 'strike', 'del',
    'u', 'code', 'pre', 'hr', 'br', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'span', 'sup', 'sub',
];

const allowedAttributes = {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    th: ['align'],
    td: ['align'],
    code: ['class'],
    pre: ['class'],
};

const sanitizeOptions = {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
        img: ['http', 'https'],
    },
    transformTags: {
        a: (tagName, attribs) => ({
            tagName: 'a',
            attribs: {
                ...attribs,
                rel: 'nofollow noopener noreferrer',
                ...(attribs.href && attribs.href.startsWith('http')
                    ? { target: '_blank' }
                    : {}),
            },
        }),
    },
};

const renderMarkdown = (src) => {
    const source = typeof src === 'string' ? src : '';
    return sanitizeHtml(md.render(source), sanitizeOptions);
};

export { renderMarkdown };