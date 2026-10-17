// Comparison pages. Competitor facts come ONLY from each platform's own public
// pages, read on 2026-10-11 (vyro.com, vyro.com/for-brands, whop.com/contentrewards,
// makeclout.com, makeclout.com/what-is-clipping). Anything a platform does not
// publish is marked as such — never guessed. Re-check before each update.
import type { Guide, Block } from './guides';
import type { Language } from '@/context/LanguageContext';

type L<T> = Record<Language, T>;

const NOTE: L<Block> = {
  en: { t: 'note', x: 'Competitor details come from each platform’s own public pages, read in October 2026. Platforms change their terms often — if something here is out of date, tell us through the Contact page and we will correct it.' },
  ru: { t: 'note', x: 'Данные о других платформах взяты с их собственных открытых страниц в октябре 2026 года. Условия часто меняются — если что-то устарело, напишите нам через страницу «Контакты», и мы исправим.' },
  kk: { t: 'note', x: 'Басқа платформалар туралы деректер олардың өз ашық беттерінен 2026 жылғы қазанда алынған. Шарттар жиі өзгереді — бірдеңе ескірсе, «Байланыс» беті арқылы жазыңыз, біз түзетеміз.' },
};

/* Clipte facts reused across pages */
const CLIPTE = {
  pay: { en: 'CPM set per campaign and per platform', ru: 'CPM по кампании и по платформе', kk: 'Кампания және платформа бойынша CPM' },
  caps: { en: 'Brand-set minimum payout and maximum cap per clip', ru: 'Минимальная выплата и лимит на клип задаёт бренд', kk: 'Ең аз төлем мен клипке шекті бренд белгілейді' },
  payouts: { en: 'Weekly — PayPal or crypto (USDT, USDC, BTC, ETH, SOL)', ru: 'Еженедельно — PayPal или крипто (USDT, USDC, BTC, ETH, SOL)', kk: 'Апта сайын — PayPal немесе крипто (USDT, USDC, BTC, ETH, SOL)' },
  check: { en: '24–48 hour anti-fraud hold on every clip', ru: 'Антифрод-холд 24–48 часов для каждого клипа', kk: 'Әр клипке 24–48 сағаттық антифрод тексеру' },
  platforms: { en: 'TikTok, YouTube Shorts, Instagram Reels', ru: 'TikTok, YouTube Shorts, Instagram Reels', kk: 'TikTok, YouTube Shorts, Instagram Reels' },
  followers: { en: 'None required', ru: 'Не нужны', kk: 'Қажет емес' },
  review: { en: 'Every campaign reviewed by moderators', ru: 'Каждую кампанию проверяют модераторы', kk: 'Әр кампанияны модераторлар тексереді' },
  languages: { en: 'English, Russian, Kazakh', ru: 'Английский, русский, казахский', kk: 'Ағылшын, орыс, қазақ' },
};

const ROWS = {
  pay: { en: 'How clippers are paid', ru: 'Как платят клипперам', kk: 'Клипперлерге қалай төленеді' },
  caps: { en: 'Per-clip limits', ru: 'Лимиты на клип', kk: 'Клипке шектер' },
  payouts: { en: 'Payouts', ru: 'Выплаты', kk: 'Төлемдер' },
  check: { en: 'View verification', ru: 'Проверка просмотров', kk: 'Қаралымдарды тексеру' },
  platforms: { en: 'Platforms', ru: 'Платформы', kk: 'Платформалар' },
  followers: { en: 'Follower minimum', ru: 'Минимум подписчиков', kk: 'Жазылушылардың ең аз саны' },
  review: { en: 'Campaign review', ru: 'Проверка кампаний', kk: 'Кампанияларды тексеру' },
};

const NOT_PUBLISHED: L<string> = { en: 'Not published', ru: 'Не опубликовано', kk: 'Жарияланбаған' };

const row = (key: keyof typeof ROWS, lang: Language, other: string) => [ROWS[key][lang], CLIPTE[key][lang], other];

export const COMPARE_PAGES: Record<string, Guide> = {
  /* ------------------------------------------------------------------ */
  vyro: {
    slug: 'vyro',
    category: { en: 'Compare', ru: 'Сравнение', kk: 'Салыстыру' },
    minutes: 4,
    updated: '2026-10-11',
    title: { en: 'Clipte vs Vyro', ru: 'Clipte vs Vyro', kk: 'Clipte vs Vyro' },
    excerpt: {
      en: 'Two pay-per-view clipping marketplaces, side by side — how pay, payouts and verification differ.',
      ru: 'Две платформы клиппинга с оплатой за просмотры бок о бок — чем отличаются оплата, выплаты и проверка.',
      kk: 'Қаралым үшін төлейтін екі клиппинг платформасы қатар — төлем, төлем шығару және тексеру немен ерекшеленеді.',
    },
    body: {
      en: [
        { t: 'p', x: 'Vyro is a clipping marketplace that describes itself as trusted by creators such as MrBeast and Mark Rober. Like Clipte, it lets creators and brands post campaigns and pays clippers per 1,000 views. The differences are mostly in payout timing, payout methods and how limits are set.' },
        { t: 'h', x: 'At a glance' },
        { t: 'table', head: ['', 'Clipte', 'Vyro'], rows: [
          row('pay', 'en', 'CPM listed per campaign (e.g. $1,500–$2,000 per 1M views on public listings)'),
          row('caps', 'en', 'Campaign budget; per-clip cap not published'),
          row('payouts', 'en', 'Stripe or PayPal; funds released after the campaign ends and a final check; $10 minimum withdrawal, once per week'),
          row('check', 'en', 'Metrics read from connected accounts; compliance and fraud checks; final verification at campaign end'),
          row('platforms', 'en', 'TikTok, Instagram, YouTube Shorts, X'),
          row('followers', 'en', 'Not stated'),
          row('review', 'en', 'Campaign listings reviewed'),
        ] },
        { t: 'h', x: 'Where they differ' },
        { t: 'ul', items: [
          'Payout timing: Vyro shows earnings as pending while a campaign runs and releases them after it ends. Clipte verifies each clip after a 24–48 hour hold and pays weekly.',
          'Payout methods: Vyro pays through Stripe or PayPal depending on location. Clipte pays to PayPal or crypto wallets.',
          'Per-clip control: on Clipte, brands set a minimum payout and maximum cap per clip for each platform.',
          'Platforms: Vyro also supports X. Clipte currently focuses on TikTok, YouTube Shorts and Instagram Reels.',
          'Brands: Vyro states a $1,000 minimum campaign budget. Clipte brands fund an escrow budget that is reviewed with the campaign.',
        ] },
        { t: 'h', x: 'Which should you choose?' },
        { t: 'p', x: 'Plenty of clippers use more than one marketplace. If you want weekly payouts and crypto options, Clipte fits well; if you post on X or need Stripe payouts, Vyro covers that. Either way, the habits that earn are the same — read our best practices guide.' },
        NOTE.en,
      ],
      ru: [
        { t: 'p', x: 'Vyro — маркетплейс клиппинга, который называет среди своих пользователей таких авторов, как MrBeast и Mark Rober. Как и в Clipte, авторы и бренды размещают кампании, а клипперам платят за 1 000 просмотров. Различия в основном в сроках выплат, способах выплат и в том, как задаются лимиты.' },
        { t: 'h', x: 'Коротко' },
        { t: 'table', head: ['', 'Clipte', 'Vyro'], rows: [
          row('pay', 'ru', 'CPM указан в кампании (например, $1 500–$2 000 за 1 млн просмотров в открытых кампаниях)'),
          row('caps', 'ru', 'Бюджет кампании; лимит на клип не опубликован'),
          row('payouts', 'ru', 'Stripe или PayPal; средства выплачиваются после окончания кампании и финальной проверки; минимум $10, раз в неделю'),
          row('check', 'ru', 'Метрики из подключённых аккаунтов; проверки на соответствие и фрод; финальная проверка в конце кампании'),
          row('platforms', 'ru', 'TikTok, Instagram, YouTube Shorts, X'),
          row('followers', 'ru', 'Не указано'),
          row('review', 'ru', 'Кампании проверяются'),
        ] },
        { t: 'h', x: 'В чём разница' },
        { t: 'ul', items: [
          'Сроки выплат: Vyro показывает заработок как ожидающий, пока идёт кампания, и выплачивает после её окончания. Clipte подтверждает каждый клип после холда 24–48 часов и платит еженедельно.',
          'Способы выплат: Vyro платит через Stripe или PayPal в зависимости от страны. Clipte — на PayPal или криптокошельки.',
          'Контроль по клипу: в Clipte бренды задают минимальную выплату и максимальный лимит на клип для каждой платформы.',
          'Платформы: Vyro также поддерживает X. Clipte сейчас сосредоточен на TikTok, YouTube Shorts и Instagram Reels.',
          'Бренды: у Vyro минимальный бюджет кампании $1 000. В Clipte бренды пополняют эскроу-бюджет, который проверяется вместе с кампанией.',
        ] },
        { t: 'h', x: 'Что выбрать?' },
        { t: 'p', x: 'Многие клипперы работают на нескольких площадках. Если вам важны еженедельные выплаты и крипто — Clipte подходит хорошо; если вы публикуетесь в X или нужны выплаты через Stripe — это есть у Vyro. В любом случае зарабатывают одни и те же привычки — прочитайте наш гайд по лучшим практикам.' },
        NOTE.ru,
      ],
      kk: [
        { t: 'p', x: 'Vyro — пайдаланушылары арасында MrBeast және Mark Rober сияқты авторларды атайтын клиппинг маркетплейсі. Clipte сияқты, авторлар мен брендтер кампания орналастырады, ал клипперлерге 1 000 қаралым үшін төленеді. Айырмашылықтар негізінен төлем мерзімдерінде, төлем әдістерінде және шектердің қалай белгіленетінінде.' },
        { t: 'h', x: 'Қысқаша' },
        { t: 'table', head: ['', 'Clipte', 'Vyro'], rows: [
          row('pay', 'kk', 'CPM кампанияда көрсетілген (мысалы, ашық кампанияларда 1 млн қаралымға $1 500–$2 000)'),
          row('caps', 'kk', 'Кампания бюджеті; клипке шек жарияланбаған'),
          row('payouts', 'kk', 'Stripe немесе PayPal; қаражат кампания аяқталып, соңғы тексеруден кейін беріледі; ең аз $10, аптасына бір рет'),
          row('check', 'kk', 'Қосылған аккаунттардан метрикалар; сәйкестік пен фродқа тексеру; кампания соңында соңғы тексеру'),
          row('platforms', 'kk', 'TikTok, Instagram, YouTube Shorts, X'),
          row('followers', 'kk', 'Көрсетілмеген'),
          row('review', 'kk', 'Кампаниялар тексеріледі'),
        ] },
        { t: 'h', x: 'Айырмашылығы неде' },
        { t: 'ul', items: [
          'Төлем мерзімі: Vyro кампания жүріп жатқанда табысты күтудегі деп көрсетеді және ол аяқталғаннан кейін береді. Clipte әр клипті 24–48 сағаттық тексеруден кейін растап, апта сайын төлейді.',
          'Төлем әдістері: Vyro елге қарай Stripe немесе PayPal арқылы төлейді. Clipte — PayPal немесе криптоәмияндарға.',
          'Клип бойынша бақылау: Clipte-те брендтер әр платформа үшін бір клипке ең аз төлем мен ең жоғары шекті белгілейді.',
          'Платформалар: Vyro X-ті де қолдайды. Clipte қазір TikTok, YouTube Shorts және Instagram Reels-ке шоғырланған.',
          'Брендтер: Vyro-да кампанияның ең аз бюджеті $1 000. Clipte-те брендтер кампаниямен бірге тексерілетін эскроу бюджетін толтырады.',
        ] },
        { t: 'h', x: 'Қайсысын таңдау керек?' },
        { t: 'p', x: 'Көптеген клипперлер бірнеше алаңда жұмыс істейді. Апта сайынғы төлемдер мен крипто маңызды болса — Clipte жақсы келеді; X-те жарияласаңыз немесе Stripe арқылы төлем керек болса — бұл Vyro-да бар. Қалай болғанда да, табыс әкелетін әдеттер бірдей — үздік тәжірибелер нұсқаулығымызды оқыңыз.' },
        NOTE.kk,
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  'whop-clips': {
    slug: 'whop-clips',
    category: { en: 'Compare', ru: 'Сравнение', kk: 'Салыстыру' },
    minutes: 4,
    updated: '2026-10-11',
    title: { en: 'Clipte vs Whop Content Rewards', ru: 'Clipte vs Whop Content Rewards', kk: 'Clipte vs Whop Content Rewards' },
    excerpt: {
      en: 'How Clipte compares with Content Rewards, the clipping hub on Whop.',
      ru: 'Чем Clipte отличается от Content Rewards — хаба клиппинга на Whop.',
      kk: 'Clipte Whop-тағы клиппинг хабы Content Rewards-тан немен ерекшеленеді.',
    },
    body: {
      en: [
        { t: 'p', x: 'Content Rewards is a large clipping community on Whop, where brands list campaigns with a budget and a pay rate per 1,000 views. Its public page shows the campaign feed; most payout and fee details are not published there.' },
        { t: 'h', x: 'At a glance' },
        { t: 'table', head: ['', 'Clipte', 'Whop Content Rewards'], rows: [
          row('pay', 'en', 'CPM per campaign (public listings show about $0.25–$2.00 per 1,000 views)'),
          row('caps', 'en', NOT_PUBLISHED.en),
          row('payouts', 'en', 'Not published on the public page'),
          row('check', 'en', 'Not published on the public page'),
          row('platforms', 'en', 'Varies by campaign: TikTok, Instagram, YouTube, X'),
          row('followers', 'en', 'Not stated'),
          row('review', 'en', NOT_PUBLISHED.en),
        ] },
        { t: 'h', x: 'Where they differ' },
        { t: 'ul', items: [
          'Transparency: Clipte publishes how verification, holds and payouts work in its documentation; Content Rewards keeps those details inside the Whop app.',
          'Per-platform rates: Clipte campaigns can set a different rate, minimum payout and cap for TikTok, YouTube Shorts and Instagram Reels.',
          'Review: every Clipte campaign is checked by a moderator before clippers see it.',
          'Scale: Content Rewards is one of the largest clipping communities, so it lists many campaigns at once.',
        ] },
        { t: 'tip', x: 'Before you join any campaign, check three things: the rate per platform, whether there is a per-clip cap, and how much budget is left.' },
        NOTE.en,
      ],
      ru: [
        { t: 'p', x: 'Content Rewards — крупное сообщество клиппинга на Whop, где бренды размещают кампании с бюджетом и ставкой за 1 000 просмотров. Открытая страница показывает ленту кампаний; большинство деталей о выплатах и комиссиях там не опубликовано.' },
        { t: 'h', x: 'Коротко' },
        { t: 'table', head: ['', 'Clipte', 'Whop Content Rewards'], rows: [
          row('pay', 'ru', 'CPM по кампании (в открытых кампаниях около $0,25–$2,00 за 1 000 просмотров)'),
          row('caps', 'ru', NOT_PUBLISHED.ru),
          row('payouts', 'ru', 'Не опубликовано на открытой странице'),
          row('check', 'ru', 'Не опубликовано на открытой странице'),
          row('platforms', 'ru', 'Зависит от кампании: TikTok, Instagram, YouTube, X'),
          row('followers', 'ru', 'Не указано'),
          row('review', 'ru', NOT_PUBLISHED.ru),
        ] },
        { t: 'h', x: 'В чём разница' },
        { t: 'ul', items: [
          'Прозрачность: Clipte описывает проверку, холды и выплаты в документации; Content Rewards хранит эти детали внутри приложения Whop.',
          'Ставки по платформам: кампании Clipte могут задавать разную ставку, минимальную выплату и лимит для TikTok, YouTube Shorts и Instagram Reels.',
          'Проверка: каждую кампанию Clipte смотрит модератор, прежде чем её увидят клипперы.',
          'Масштаб: Content Rewards — одно из крупнейших сообществ клиппинга, поэтому там одновременно много кампаний.',
        ] },
        { t: 'tip', x: 'Перед участием в любой кампании проверьте три вещи: ставку по платформе, есть ли лимит на клип и сколько осталось бюджета.' },
        NOTE.ru,
      ],
      kk: [
        { t: 'p', x: 'Content Rewards — Whop-тағы ірі клиппинг қауымдастығы, онда брендтер бюджеті және 1 000 қаралымға мөлшерлемесі бар кампанияларды орналастырады. Ашық бетте кампаниялар лентасы көрсетіледі; төлемдер мен комиссиялар туралы мәліметтердің көбі онда жарияланбаған.' },
        { t: 'h', x: 'Қысқаша' },
        { t: 'table', head: ['', 'Clipte', 'Whop Content Rewards'], rows: [
          row('pay', 'kk', 'Кампания бойынша CPM (ашық кампанияларда 1 000 қаралымға шамамен $0,25–$2,00)'),
          row('caps', 'kk', NOT_PUBLISHED.kk),
          row('payouts', 'kk', 'Ашық бетте жарияланбаған'),
          row('check', 'kk', 'Ашық бетте жарияланбаған'),
          row('platforms', 'kk', 'Кампанияға байланысты: TikTok, Instagram, YouTube, X'),
          row('followers', 'kk', 'Көрсетілмеген'),
          row('review', 'kk', NOT_PUBLISHED.kk),
        ] },
        { t: 'h', x: 'Айырмашылығы неде' },
        { t: 'ul', items: [
          'Ашықтық: Clipte тексеру, ұстау және төлемдердің қалай жұмыс істейтінін құжаттамада сипаттайды; Content Rewards бұл мәліметтерді Whop қосымшасының ішінде сақтайды.',
          'Платформалар бойынша мөлшерлемелер: Clipte кампаниялары TikTok, YouTube Shorts және Instagram Reels үшін әртүрлі мөлшерлеме, ең аз төлем және шек белгілей алады.',
          'Тексеру: Clipte-тің әр кампаниясын клипперлер көрмей тұрып модератор қарайды.',
          'Ауқым: Content Rewards — ең ірі клиппинг қауымдастықтарының бірі, сондықтан онда бір мезгілде көп кампания бар.',
        ] },
        { t: 'tip', x: 'Кез келген кампанияға қосылмас бұрын үш нәрсені тексеріңіз: платформа бойынша мөлшерлеме, клипке шек бар ма және қанша бюджет қалды.' },
        NOTE.kk,
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  makeclout: {
    slug: 'makeclout',
    category: { en: 'Compare', ru: 'Сравнение', kk: 'Салыстыру' },
    minutes: 3,
    updated: '2026-10-11',
    title: { en: 'Clipte vs MakeClout (Clouted)', ru: 'Clipte vs MakeClout (Clouted)', kk: 'Clipte vs MakeClout (Clouted)' },
    excerpt: {
      en: 'A per-view marketplace versus an application-based clipping program.',
      ru: 'Маркетплейс с оплатой за просмотры против клиппинг-программы по заявке.',
      kk: 'Қаралым үшін төлейтін маркетплейс пен өтініш бойынша клиппинг бағдарламасы.',
    },
    body: {
      en: [
        { t: 'p', x: 'makeclout.com now presents the Clouted Clipping Program: clippers apply, browse live campaigns from brands and creators, and edit 30–90 second clips for TikTok, Instagram Reels and YouTube Shorts.' },
        { t: 'h', x: 'At a glance' },
        { t: 'table', head: ['', 'Clipte', 'Clouted (MakeClout)'], rows: [
          row('pay', 'en', 'Pay basis not published; the site quotes earnings ranges (e.g. $1,000–$5,000 a month for 10–15 hours a week)'),
          row('caps', 'en', NOT_PUBLISHED.en),
          row('payouts', 'en', 'Weekly or bi-weekly; methods not published'),
          row('check', 'en', NOT_PUBLISHED.en),
          row('platforms', 'en', 'TikTok, Instagram Reels, YouTube Shorts'),
          row('followers', 'en', 'Not stated; “no experience required”'),
          row('review', 'en', 'Clippers apply to join'),
        ] },
        { t: 'h', x: 'Where they differ' },
        { t: 'ul', items: [
          'Pay model: every Clipte campaign shows its rate per 1,000 views up front. Clouted describes earnings as monthly ranges rather than a published rate.',
          'Joining: Clipte is open sign-up — connect an account and start. Clouted uses an application.',
          'Verification: Clipte documents its 24–48 hour anti-fraud hold and clip statuses.',
        ] },
        NOTE.en,
      ],
      ru: [
        { t: 'p', x: 'Сейчас makeclout.com представляет Clouted Clipping Program: клипперы подают заявку, выбирают активные кампании брендов и авторов и монтируют клипы длиной 30–90 секунд для TikTok, Instagram Reels и YouTube Shorts.' },
        { t: 'h', x: 'Коротко' },
        { t: 'table', head: ['', 'Clipte', 'Clouted (MakeClout)'], rows: [
          row('pay', 'ru', 'Принцип оплаты не опубликован; на сайте указаны диапазоны дохода (например, $1 000–$5 000 в месяц при 10–15 часах в неделю)'),
          row('caps', 'ru', NOT_PUBLISHED.ru),
          row('payouts', 'ru', 'Раз в неделю или раз в две недели; способы не опубликованы'),
          row('check', 'ru', NOT_PUBLISHED.ru),
          row('platforms', 'ru', 'TikTok, Instagram Reels, YouTube Shorts'),
          row('followers', 'ru', 'Не указано; «опыт не нужен»'),
          row('review', 'ru', 'Клипперы подают заявку'),
        ] },
        { t: 'h', x: 'В чём разница' },
        { t: 'ul', items: [
          'Модель оплаты: каждая кампания Clipte сразу показывает ставку за 1 000 просмотров. Clouted описывает доход месячными диапазонами, а не опубликованной ставкой.',
          'Вход: в Clipte открытая регистрация — подключите аккаунт и начинайте. В Clouted нужна заявка.',
          'Проверка: Clipte описывает антифрод-холд 24–48 часов и статусы клипов.',
        ] },
        NOTE.ru,
      ],
      kk: [
        { t: 'p', x: 'Қазір makeclout.com Clouted Clipping Program-ды ұсынады: клипперлер өтініш беріп, брендтер мен авторлардың белсенді кампанияларын таңдайды және TikTok, Instagram Reels және YouTube Shorts үшін 30–90 секундтық клиптер монтаждайды.' },
        { t: 'h', x: 'Қысқаша' },
        { t: 'table', head: ['', 'Clipte', 'Clouted (MakeClout)'], rows: [
          row('pay', 'kk', 'Төлем қағидасы жарияланбаған; сайтта табыс диапазондары көрсетілген (мысалы, аптасына 10–15 сағатта айына $1 000–$5 000)'),
          row('caps', 'kk', NOT_PUBLISHED.kk),
          row('payouts', 'kk', 'Аптасына немесе екі аптада бір рет; әдістері жарияланбаған'),
          row('check', 'kk', NOT_PUBLISHED.kk),
          row('platforms', 'kk', 'TikTok, Instagram Reels, YouTube Shorts'),
          row('followers', 'kk', 'Көрсетілмеген; «тәжірибе қажет емес»'),
          row('review', 'kk', 'Клипперлер өтініш береді'),
        ] },
        { t: 'h', x: 'Айырмашылығы неде' },
        { t: 'ul', items: [
          'Төлем моделі: Clipte-тің әр кампаниясы 1 000 қаралымға мөлшерлемені бірден көрсетеді. Clouted табысты жарияланған мөлшерлемемен емес, айлық диапазондармен сипаттайды.',
          'Қосылу: Clipte-те ашық тіркелу — аккаунтты қосып, бастай беріңіз. Clouted-та өтініш қажет.',
          'Тексеру: Clipte 24–48 сағаттық антифрод тексеруді және клип мәртебелерін сипаттайды.',
        ] },
        NOTE.kk,
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  'best-clipping-platforms': {
    slug: 'best-clipping-platforms',
    category: { en: 'Compare', ru: 'Сравнение', kk: 'Салыстыру' },
    minutes: 5,
    updated: '2026-10-11',
    title: { en: 'Best clipping platforms in 2026', ru: 'Лучшие платформы для клиппинга в 2026 году', kk: '2026 жылғы үздік клиппинг платформалары' },
    excerpt: {
      en: 'Where clippers can earn today — and the questions to ask before you join any of them.',
      ru: 'Где клипперы могут зарабатывать сегодня — и какие вопросы задать перед тем, как присоединиться.',
      kk: 'Клипперлер бүгін қайда табыс таба алады — және қосылмас бұрын қандай сұрақтар қою керек.',
    },
    body: {
      en: [
        { t: 'p', x: 'Clipping has grown from a few Discord servers into a set of dedicated marketplaces. They all connect clippers with creators and brands, but they differ in how they pay, how fast, and how openly they explain it. Here is an honest overview — including us.' },
        { t: 'h', x: 'Questions to ask any platform' },
        { t: 'ul', items: [
          'Is the rate published up front, per 1,000 views, for each platform?',
          'Are there per-clip minimums or caps?',
          'How are views verified, and how long is the hold?',
          'When and how do payouts arrive, and is there a fee or minimum withdrawal?',
          'Does the platform review campaigns before clippers see them?',
        ] },
        { t: 'h', x: 'The platforms' },
        { t: 'table', head: ['Platform', 'Model', 'Good fit if you…'], rows: [
          ['Clipte', 'Per-view CPM per platform, weekly payouts (PayPal or crypto), moderated campaigns', 'want clear per-platform rates, weekly payouts and an interface in English, Russian or Kazakh'],
          ['Vyro', 'Per-view CPM per campaign; funds released after the campaign ends (Stripe or PayPal)', 'post on X as well, or prefer Stripe payouts'],
          ['Whop Content Rewards', 'Large campaign feed on Whop with CPM and budget per listing', 'already use Whop and want the widest choice of campaigns'],
          ['Clouted (MakeClout)', 'Application-based program; earnings described as monthly ranges', 'prefer joining a managed program after an application'],
        ] },
        { t: 'tip', x: 'There is no rule against using more than one platform. Many clippers keep one main platform and check others for campaigns that fit their niche.' },
        { t: 'h', x: 'How we put this together' },
        { t: 'p', x: 'Every competitor detail comes from that platform’s own public pages. We did not include claims from anonymous reviews, and where a platform does not publish something, we say so instead of guessing.' },
        NOTE.en,
      ],
      ru: [
        { t: 'p', x: 'Клиппинг вырос из нескольких Discord-серверов в набор специализированных площадок. Все они соединяют клипперов с авторами и брендами, но отличаются тем, как платят, как быстро и насколько открыто это объясняют. Вот честный обзор — включая нас.' },
        { t: 'h', x: 'Вопросы, которые стоит задать любой платформе' },
        { t: 'ul', items: [
          'Опубликована ли ставка заранее — за 1 000 просмотров и по каждой платформе?',
          'Есть ли минимум или лимит на клип?',
          'Как проверяются просмотры и сколько длится холд?',
          'Когда и как приходят выплаты, есть ли комиссия или минимальная сумма вывода?',
          'Проверяет ли платформа кампании до того, как их увидят клипперы?',
        ] },
        { t: 'h', x: 'Платформы' },
        { t: 'table', head: ['Платформа', 'Модель', 'Подойдёт, если вы…'], rows: [
          ['Clipte', 'CPM за просмотры по платформам, еженедельные выплаты (PayPal или крипто), кампании с модерацией', 'хотите понятные ставки по платформам, еженедельные выплаты и интерфейс на английском, русском или казахском'],
          ['Vyro', 'CPM по кампании; средства выплачиваются после окончания кампании (Stripe или PayPal)', 'также публикуетесь в X или предпочитаете выплаты через Stripe'],
          ['Whop Content Rewards', 'Большая лента кампаний на Whop с CPM и бюджетом в каждой', 'уже пользуетесь Whop и хотите максимальный выбор кампаний'],
          ['Clouted (MakeClout)', 'Программа по заявке; доход описан месячными диапазонами', 'предпочитаете управляемую программу с отбором'],
        ] },
        { t: 'tip', x: 'Никто не запрещает работать на нескольких платформах. Многие клипперы держат одну основную и проверяют другие на подходящие кампании.' },
        { t: 'h', x: 'Как мы составляли обзор' },
        { t: 'p', x: 'Все данные о других платформах взяты с их собственных открытых страниц. Мы не использовали анонимные отзывы, а если платформа что-то не публикует — так и пишем, а не гадаем.' },
        NOTE.ru,
      ],
      kk: [
        { t: 'p', x: 'Клиппинг бірнеше Discord серверінен арнайы алаңдар жиынтығына айналды. Олардың бәрі клипперлерді авторлар мен брендтермен байланыстырады, бірақ қалай, қаншалықты жылдам төлейтінімен және мұны қаншалықты ашық түсіндіретінімен ерекшеленеді. Міне, адал шолу — бізді қоса.' },
        { t: 'h', x: 'Кез келген платформаға қоятын сұрақтар' },
        { t: 'ul', items: [
          'Мөлшерлеме алдын ала — 1 000 қаралымға және әр платформа бойынша жарияланған ба?',
          'Клипке ең аз шек немесе шектеу бар ма?',
          'Қаралымдар қалай тексеріледі және ұстау қанша уақытқа созылады?',
          'Төлемдер қашан және қалай келеді, комиссия немесе ең аз шығару сомасы бар ма?',
          'Платформа кампанияларды клипперлер көрмей тұрып тексере ме?',
        ] },
        { t: 'h', x: 'Платформалар' },
        { t: 'table', head: ['Платформа', 'Модель', 'Сізге келеді, егер…'], rows: [
          ['Clipte', 'Платформалар бойынша қаралым үшін CPM, апта сайынғы төлемдер (PayPal немесе крипто), модерацияланған кампаниялар', 'платформалар бойынша анық мөлшерлеме, апта сайынғы төлем және ағылшын, орыс немесе қазақ тіліндегі интерфейс керек болса'],
          ['Vyro', 'Кампания бойынша CPM; қаражат кампания аяқталғаннан кейін беріледі (Stripe немесе PayPal)', 'X-те де жарияласаңыз немесе Stripe арқылы төлемді қаласаңыз'],
          ['Whop Content Rewards', 'Whop-тағы әр кампанияда CPM және бюджеті бар үлкен лента', 'Whop-ты қолданып жүрсеңіз және кампаниялардың ең кең таңдауын қаласаңыз'],
          ['Clouted (MakeClout)', 'Өтініш бойынша бағдарлама; табыс айлық диапазондармен сипатталған', 'іріктеуі бар басқарылатын бағдарламаны қаласаңыз'],
        ] },
        { t: 'tip', x: 'Бірнеше платформада жұмыс істеуге ешкім тыйым салмайды. Көптеген клипперлер бір негізгісін ұстап, басқаларынан өз нишасына сай кампанияларды іздейді.' },
        { t: 'h', x: 'Шолуды қалай жасадық' },
        { t: 'p', x: 'Басқа платформалар туралы барлық деректер олардың өз ашық беттерінен алынған. Біз анонимді пікірлерді қолданбадық, ал платформа бірдеңені жарияламаса — болжамай, солай деп жазамыз.' },
        NOTE.kk,
      ],
    },
  },
};

/** Hub page: short intro + list of comparisons (rendered by CompareHub). */
export const COMPARE_HUB = {
  title: { en: 'Compare clipping platforms', ru: 'Сравнение платформ для клиппинга', kk: 'Клиппинг платформаларын салыстыру' },
  excerpt: {
    en: 'Fair, sourced comparisons between Clipte and other places clippers earn.',
    ru: 'Честные сравнения Clipte с другими площадками для клипперов — с источниками.',
    kk: 'Clipte мен клипперлер табыс табатын басқа алаңдардың әділ, дереккөзі бар салыстырулары.',
  },
};
