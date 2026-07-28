/**
 * What the console shows, and what it calls things.
 *
 * Every entry here maps a place in content/site.json to plain English. The
 * console renders nothing that is not listed, so this file is the one place
 * to edit when the site gains or loses a piece of copy.
 *
 * Field types:
 *   rich   one line of copy, edited with bold/italic buttons
 *   long   a paragraph, same buttons
 *   text   plain text, no formatting (names, numbers, labels)
 *   url    a web address
 *   image  a picture, uploaded from the computer
 *   list   a simple list of lines
 *   date   a calendar date
 */
window.PL_SCHEMA = {

  /* ── the three things you can edit ───────────────────────────── */
  nav: [
    { id: 'blog', label: 'Blog posts', icon: 'pencil' },
    { id: 'pages', label: 'Website text', icon: 'page' },
    { id: 'form', label: 'Application form', icon: 'form' },
    { id: 'applications', label: 'Applications', icon: 'inbox' },
  ],

  /**
   * The people who have applied. Unlike everything else here, these live on
   * the server and are never published to the website — so this section
   * saves the moment you change something, with no Publish step.
   *
   * The ids must match STATUSES in the backend's submissions.js.
   */
  submissionStatuses: [
    { value: 'new', label: 'New', blurb: 'Applied, not yet replied to.' },
    { value: 'contacted', label: 'Replied', blurb: 'You have written back.' },
    { value: 'won', label: 'Signed up', blurb: 'They became a client.' },
    { value: 'archived', label: 'Closed', blurb: 'Not going ahead.' },
    { value: 'spam', label: 'Spam', blurb: 'Junk, or caught by the spam checks.' },
  ],

  /* ── website text, one panel per part of the site ────────────── */
  pages: [
    {
      id: 'hero',
      label: 'Top of the home page',
      blurb: 'The big headline and photo people see first.',
      cards: [
        {
          title: 'Headline',
          fields: [
            { key: 'hero.line1', label: 'First line', type: 'rich' },
            { key: 'hero.line2', label: 'Second line', type: 'rich' },
            { key: 'hero.line3', label: 'Third line', type: 'rich' },
            { key: 'hero.body', label: 'The sentence underneath', type: 'long' },
            { key: 'hero.ctaLabel', label: 'Text on the button', type: 'text' },
            { key: 'hero.spine', label: 'Small sideways text down the edge', type: 'text' },
          ],
        },
        {
          title: 'Main photo',
          fields: [{ key: 'images.hero', label: 'Photo of you at the top of the page', type: 'image' }],
        },
        {
          title: 'Scrolling strip',
          sub: 'The line of words that slides across under the headline.',
          fields: [{ key: 'ticker.text', label: 'Words in the strip', type: 'long' }],
        },
      ],
    },
    {
      id: 'story',
      label: 'Your story',
      blurb: 'The "meet your coach" section.',
      cards: [
        {
          title: 'Photo',
          fields: [
            { key: 'images.story', label: 'Portrait of you', type: 'image' },
          ],
        },
        {
          title: 'Copy',
          fields: [
            { key: 'story.eyebrow', label: 'Small label above the heading', type: 'text' },
            { key: 'story.heading', label: 'Heading', type: 'rich' },
            { key: 'story.lead', label: 'Opening line', type: 'long' },
            { key: 'story.p1', label: 'Paragraph 1', type: 'long' },
            { key: 'story.p2', label: 'Paragraph 2', type: 'long' },
            { key: 'story.p3', label: 'Paragraph 3', type: 'long' },
            { key: 'story.pull', label: 'The highlighted quote in the middle', type: 'long' },
            { key: 'story.p4', label: 'Paragraph 4', type: 'long' },
            { key: 'story.sign', label: 'Sign-off', type: 'rich' },
          ],
        },
        {
          title: 'Photo caption',
          fields: [
            { key: 'story.captionName', label: 'Name', type: 'text' },
            { key: 'story.captionRole', label: 'Role', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'system',
      label: 'What clients get',
      blurb: 'The six cards describing what is included in coaching.',
      cards: [
        {
          title: 'Section heading',
          fields: [
            { key: 'system.eyebrow', label: 'Small label above the heading', type: 'text' },
            { key: 'system.heading', label: 'Heading', type: 'rich' },
            { key: 'system.sub', label: 'Sentence under the heading', type: 'long' },
          ],
        },
        ...[1, 2, 3, 4, 5, 6].map((n) => ({
          title: `Card ${n}`,
          fields: [
            { key: `system.card${n}.title`, label: 'Title', type: 'rich' },
            { key: `system.card${n}.body`, label: 'Description', type: 'long' },
          ],
        })),
      ],
    },
    {
      id: 'results',
      label: 'Client results',
      blurb: 'Before-and-after cards, and the numbers underneath them.',
      cards: [{
        title: 'Section heading',
        fields: [
          { key: 'results.eyebrow', label: 'Small label above the heading', type: 'text' },
          { key: 'results.heading', label: 'Heading', type: 'rich' },
          { key: 'results.sub', label: 'Sentence under the heading', type: 'long' },
        ],
      }],
      collections: ['transformations', 'stats'],
    },
    {
      id: 'videos',
      label: 'Video testimonials',
      blurb: 'Stays hidden on the website until you add a clip.',
      cards: [{
        title: 'Section heading',
        fields: [
          { key: 'videos.eyebrow', label: 'Small label above the heading', type: 'text' },
          { key: 'videos.heading', label: 'Heading', type: 'rich' },
          { key: 'videos.sub', label: 'Sentence under the heading', type: 'long' },
        ],
      }],
      collections: ['videoClips'],
    },
    {
      id: 'faq',
      label: 'Questions & answers',
      blurb: 'The drop-down questions near the bottom of the home page.',
      cards: [{
        title: 'Section heading',
        fields: [
          { key: 'faq.eyebrow', label: 'Small label above the heading', type: 'text' },
          { key: 'faq.heading', label: 'Heading', type: 'rich' },
          { key: 'faq.sub', label: 'Sentence under the heading', type: 'long' },
          { key: 'faq.ctaLabel', label: 'Text on the button', type: 'text' },
        ],
      }],
      collections: ['faqs'],
    },
    {
      id: 'enquiry',
      label: 'Apply section',
      blurb: 'The closing call to action on the home page.',
      cards: [{
        title: 'Copy',
        fields: [
          { key: 'enquiry.eyebrow', label: 'Small label above the heading', type: 'text' },
          { key: 'enquiry.heading', label: 'Heading', type: 'rich' },
          { key: 'enquiry.sub', label: 'Sentence under the heading', type: 'long' },
          { key: 'enquiry.assure', label: 'The reassuring line', type: 'long' },
          { key: 'enquiry.formLabel', label: 'Label above the form preview', type: 'text' },
          { key: 'enquiry.formPreview', label: 'Form preview text', type: 'long' },
          { key: 'enquiry.ctaLabel', label: 'Text on the button', type: 'text' },
          { key: 'enquiry.formNote', label: 'Small print under the button', type: 'long' },
        ],
      }],
    },
    {
      id: 'blogpage',
      label: 'Blog page heading',
      blurb: 'The top of the page that lists your articles.',
      cards: [{
        title: 'Copy',
        fields: [
          { key: 'blog.eyebrow', label: 'Small label above the heading', type: 'text' },
          { key: 'blog.heading', label: 'Heading', type: 'rich' },
          { key: 'blog.lead', label: 'Sentence under the heading', type: 'long' },
          { key: 'blog.soon', label: 'Shown only when there are no articles yet', type: 'long' },
          { key: 'blog.copyright', label: 'Footer line', type: 'long' },
          { key: 'blog.metaTitle', label: 'Title shown in the browser tab and on Google', type: 'text' },
        ],
      }],
    },
    {
      id: 'settings',
      label: 'Links & Google',
      blurb: 'Where your buttons point, and how the site looks when shared.',
      cards: [
        {
          title: 'Links',
          fields: [
            { key: 'links.apply', label: 'Application form', type: 'url', hint: 'Leave as /apply/ to use the form on your own site.' },
            { key: 'links.instagram', label: 'Instagram', type: 'url' },
            { key: 'links.youtube', label: 'YouTube', type: 'url' },
            { key: 'links.email', label: 'Email link', type: 'url', hint: 'Must start with mailto: — for example mailto:hello@pratyushliftz.com' },
          ],
        },
        {
          title: 'Google & sharing',
          sub: 'What people see in search results and when the link is pasted into WhatsApp or Instagram.',
          fields: [
            { key: 'meta.title', label: 'Title on Google', type: 'text' },
            { key: 'meta.description', label: 'Description on Google', type: 'long' },
            { key: 'meta.ogTitle', label: 'Title when shared', type: 'text' },
            { key: 'meta.ogDescription', label: 'Description when shared', type: 'long' },
          ],
        },
        {
          title: 'Footer',
          fields: [{ key: 'footer.copyright', label: 'Footer line on the home page', type: 'long' }],
        },
      ],
    },
  ],

  /* ── repeating lists of things ───────────────────────────────── */
  collections: {
    transformations: {
      label: 'Client results',
      one: 'client',
      titleField: 'name',
      blurb: 'Each card opens up when clicked. Add a video and the card plays it instead of showing the photo.',
      fields: [
        { key: 'name', label: 'Client name', type: 'text' },
        { key: 'stat', label: 'The result', type: 'text', hint: 'For example: −31 lbs · 5 months' },
        { key: 'image', label: 'Photo on the card', type: 'image' },
        { key: 'full', label: 'Bigger photo when opened', type: 'image', hint: 'Optional. The card photo is used if you leave this empty.' },
        { key: 'story', label: 'Their story', type: 'long' },
        { key: 'video', label: 'Video link', type: 'text', hint: 'Optional. A YouTube, Vimeo or Instagram embed link.' },
        { key: 'videoWide', label: 'The video is widescreen, not a vertical reel', type: 'bool' },
        { key: 'alt', label: 'Photo description for Google', type: 'long' },
        { key: 'title', label: 'Photo title', type: 'text' },
      ],
      blank: { name: 'New client', stat: '', image: '', full: '', video: '', videoType: 'embed', videoWide: false, story: '', alt: '', title: '' },
    },
    stats: {
      label: 'Numbers',
      one: 'number',
      titleField: 'label',
      blurb: 'The counters that tick up under the client results.',
      fields: [
        { key: 'count', label: 'Number', type: 'text' },
        { key: 'suffix', label: 'Sign after it', type: 'text', hint: 'Usually + or %, or leave empty.' },
        { key: 'label', label: 'What it counts', type: 'text' },
      ],
      blank: { count: '0', suffix: '', label: 'New number' },
    },
    videoClips: {
      label: 'Video clips',
      one: 'clip',
      titleField: 'name',
      fields: [
        { key: 'name', label: 'Client name', type: 'text' },
        { key: 'label', label: 'Caption', type: 'text' },
        { key: 'src', label: 'Video link', type: 'text', hint: 'A YouTube, Vimeo or Instagram embed link.' },
        { key: 'wide', label: 'Widescreen, not a vertical reel', type: 'bool' },
      ],
      blank: { name: 'New clip', label: '', src: '', type: 'embed', wide: false },
    },
    faqs: {
      label: 'Questions',
      one: 'question',
      titleField: 'q',
      fields: [
        { key: 'q', label: 'Question', type: 'rich' },
        { key: 'a', label: 'Answer', type: 'long' },
      ],
      blank: { q: 'New question', a: '' },
    },
  },

  /* ── application form ────────────────────────────────────────── */
  questionTypes: [
    { value: 'single', label: 'Pick one answer', hint: 'The form moves on as soon as they choose.' },
    { value: 'multi', label: 'Pick several answers', hint: 'They tick as many as apply, then press Next.' },
    { value: 'text', label: 'Type an answer', hint: 'A single line for them to write in.' },
    { value: 'contact', label: 'Contact details', hint: 'Name, email, phone and Instagram.' },
  ],

  formScreens: [
    {
      title: 'Thank-you screen',
      sub: 'Shown once the application has been sent.',
      fields: [
        { key: 'applyForm.success.title', label: 'Heading', type: 'rich' },
        { key: 'applyForm.success.body', label: 'Message', type: 'long' },
        { key: 'applyForm.success.cta', label: 'Text on the button', type: 'text' },
      ],
    },
    {
      title: 'Polite exit screen',
      sub: 'Shown to anyone who picks an answer you have marked as ending the form.',
      fields: [
        { key: 'applyForm.disqualify.title', label: 'Heading', type: 'rich' },
        { key: 'applyForm.disqualify.body', label: 'Message', type: 'long' },
        { key: 'applyForm.disqualify.cta', label: 'Text on the button', type: 'text' },
      ],
    },
    {
      title: 'Buttons and messages',
      fields: [
        { key: 'applyForm.labels.next', label: 'Next button', type: 'text' },
        { key: 'applyForm.labels.back', label: 'Back button', type: 'text' },
        { key: 'applyForm.labels.submit', label: 'Send button on the last question', type: 'text' },
        { key: 'applyForm.labels.enterHint', label: 'Hint beside the Next button', type: 'rich' },
        { key: 'applyForm.labels.multi', label: 'Label above a pick-several question', type: 'text', hint: 'Shown where the other questions read “Question 3 of 11”.' },
        { key: 'applyForm.labels.progress', label: 'Progress counter', type: 'text', hint: 'Keep {n} and {total} — they are filled in with the real numbers.' },
        { key: 'applyForm.labels.required', label: 'Message when an answer is missing', type: 'text' },
        { key: 'applyForm.labels.sending', label: 'While it is sending', type: 'text' },
        { key: 'applyForm.labels.error', label: 'If sending fails', type: 'long' },
      ],
    },
    {
      title: 'Google',
      fields: [
        { key: 'applyForm.meta.title', label: 'Title in the browser tab', type: 'text' },
        { key: 'applyForm.meta.description', label: 'Description for search engines', type: 'long' },
      ],
    },
  ],
};
