// Clipte guides — original content, written for Clipte (EN / RU / KK).
// Only states platform facts already promised on the landing page:
// campaigns pay per verified view, social accounts are verified, clips sit
// in a 24–48h anti-fraud hold, payouts go out weekly (PayPal or crypto).
// No rates or earnings figures — those land with the platform.

import type { Language } from '@/context/LanguageContext';
import { EARNINGS_GUIDE } from './guide-earnings';

export type Block =
  | { t: 'p'; x: string }
  | { t: 'h'; x: string }
  | { t: 'ul'; items: string[] }
  | { t: 'steps'; items: [string, string][] }
  | { t: 'tip'; x: string }
  | { t: 'takeaways'; items: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'faq'; items: [string, string][] }
  | { t: 'note'; x: string };

type L<T> = Record<Language, T>;

export type Guide = {
  slug: string;
  category: L<string>;
  minutes: number;
  updated: string; // ISO date
  title: L<string>;
  excerpt: L<string>;
  body: L<Block[]>;
};

const BASE_GUIDES: Guide[] = [
  /* ------------------------------------------------------------------ */
  {
    slug: 'how-to-become-a-clipper',
    category: { en: 'Getting started', ru: 'С чего начать', kk: 'Бастау' },
    minutes: 6,
    updated: '2026-10-11',
    title: {
      en: 'How to become a clipper',
      ru: 'Как стать клиппером',
      kk: 'Қалай клиппер болуға болады',
    },
    excerpt: {
      en: 'What clippers actually do, what you need on day one, and how to get your first campaign live on Clipte.',
      ru: 'Чем на самом деле занимаются клипперы, что нужно в первый день и как запустить первую кампанию в Clipte.',
      kk: 'Клипперлер шын мәнінде не істейді, бірінші күні не қажет және Clipte-те алғашқы кампанияны қалай бастауға болады.',
    },
    body: {
      en: [
        { t: 'p', x: 'Clipping is turning long content — streams, podcasts, interviews, music drops — into short vertical videos built for TikTok, YouTube Shorts and Instagram Reels. Creators and brands want their best moments everywhere at once, and they pay clippers to make that happen.' },
        { t: 'p', x: 'On Clipte, that deal is simple: a creator or brand opens a campaign, you post clips from their content, and you earn for every verified view those clips bring in.' },
        { t: 'h', x: 'What a clipper actually does' },
        { t: 'steps', items: [
          ['Find the moment', 'Watch the source and spot the ten seconds people will want to share — a reaction, a hot take, a punchline, a reveal.'],
          ['Cut it tight', 'Trim everything that is not the moment. Start on the action, not on the setup.'],
          ['Make it watchable on mute', 'Add clean captions and a short on-screen line that tells viewers why they should keep watching.'],
          ['Post and submit', 'Publish to your connected account, then submit the link to the campaign so your views are tracked.'],
        ] },
        { t: 'h', x: 'What you need to start' },
        { t: 'ul', items: [
          'A phone or computer. Plenty of top clippers edit entirely on mobile.',
          'An editor you are comfortable with — CapCut, Premiere Pro or DaVinci Resolve all work.',
          'An account on at least one platform: TikTok, YouTube Shorts or Instagram Reels.',
          'No follower count. Clipte has no follower minimum — campaigns pay for views, not for audience size.',
          'Be 14 or older. If you are under 18, get a parent’s or guardian’s permission — payouts then go to a method they hold or approve.',
        ] },
        { t: 'h', x: 'Your first campaign, step by step' },
        { t: 'steps', items: [
          ['Create your account', 'Sign up for free and open your dashboard.'],
          ['Connect your socials', 'Link your TikTok, Shorts or Reels account. Verification takes one click and lets us attribute views to you.'],
          ['Pick a campaign', 'Read the brief and the rules before you edit: required tags, mentions, banned content and which platforms count.'],
          ['Post, then submit the link', 'Publish the clip and paste its link into the campaign. Tracking starts from there.'],
          ['Get paid', 'Clips go through a 24–48 hour anti-fraud check, then verified views turn into balance. Payouts go out weekly.'],
        ] },
        { t: 'tip', x: 'Start with one platform and one niche you genuinely watch. You will spot the good moments faster when you already know what the audience laughs at.' },
        { t: 'h', x: 'Rules that keep your earnings safe' },
        { t: 'ul', items: [
          'Follow every campaign rule — missing a required tag or mention can make a clip ineligible.',
          'Upload your own edits. Reposting another clipper’s video is not allowed.',
          'Never buy views, likes or followers. Artificial traffic is caught during the anti-fraud hold and those views are not paid.',
          'Keep the original creator in a good light — no misleading edits or fake context.',
        ] },
        { t: 'takeaways', items: [
          'Clipping = finding the best moment and making it work as a short.',
          'You need an editor and one social account — no followers required.',
          'Read the campaign rules first, post, submit the link, get paid per verified view.',
        ] },
      ],
      ru: [
        { t: 'p', x: 'Клиппинг — это превращение длинного контента (стримов, подкастов, интервью, музыкальных релизов) в короткие вертикальные видео для TikTok, YouTube Shorts и Instagram Reels. Авторы и бренды хотят, чтобы их лучшие моменты были везде одновременно, и платят клипперам за это.' },
        { t: 'p', x: 'В Clipte всё просто: автор или бренд открывает кампанию, вы публикуете клипы из их контента и получаете деньги за каждый подтверждённый просмотр.' },
        { t: 'h', x: 'Чем на самом деле занимается клиппер' },
        { t: 'steps', items: [
          ['Найти момент', 'Посмотрите исходник и найдите те десять секунд, которыми захочется поделиться: реакцию, острое мнение, панчлайн, неожиданный поворот.'],
          ['Резать плотно', 'Уберите всё, что не относится к моменту. Начинайте с действия, а не с подводки.'],
          ['Сделать понятным без звука', 'Добавьте аккуратные субтитры и короткую надпись, которая объясняет, почему стоит досмотреть.'],
          ['Опубликовать и отправить', 'Выложите видео в подключённый аккаунт и отправьте ссылку в кампанию, чтобы просмотры учитывались.'],
        ] },
        { t: 'h', x: 'Что нужно для старта' },
        { t: 'ul', items: [
          'Телефон или компьютер. Многие сильные клипперы монтируют только на телефоне.',
          'Удобный редактор — подойдут CapCut, Premiere Pro или DaVinci Resolve.',
          'Аккаунт хотя бы на одной платформе: TikTok, YouTube Shorts или Instagram Reels.',
          'Подписчики не нужны. В Clipte нет минимума подписчиков — кампании платят за просмотры, а не за размер аудитории.',
          'Возраст от 14 лет. Если вам меньше 18, нужно разрешение родителя или законного представителя — выплаты тогда приходят на способ, который он оформил или одобрил.',
        ] },
        { t: 'h', x: 'Первая кампания по шагам' },
        { t: 'steps', items: [
          ['Создайте аккаунт', 'Зарегистрируйтесь бесплатно и откройте кабинет.'],
          ['Подключите соцсети', 'Привяжите аккаунт TikTok, Shorts или Reels. Верификация занимает один клик и позволяет засчитывать просмотры именно вам.'],
          ['Выберите кампанию', 'Прочитайте бриф и правила до монтажа: обязательные теги, упоминания, запрещённый контент и какие платформы учитываются.'],
          ['Опубликуйте и отправьте ссылку', 'Выложите клип и вставьте ссылку в кампанию. С этого момента начинается учёт.'],
          ['Получите оплату', 'Клипы проходят антифрод-проверку 24–48 часов, после чего подтверждённые просмотры превращаются в баланс. Выплаты — каждую неделю.'],
        ] },
        { t: 'tip', x: 'Начните с одной платформы и одной ниши, которую вы сами смотрите. Хорошие моменты замечаешь быстрее, когда уже знаешь, над чем смеётся аудитория.' },
        { t: 'h', x: 'Правила, которые защищают ваш доход' },
        { t: 'ul', items: [
          'Соблюдайте все правила кампании — без обязательного тега или упоминания клип может не засчитаться.',
          'Загружайте только свой монтаж. Перезаливать чужие клипы нельзя.',
          'Никогда не покупайте просмотры, лайки или подписчиков. Искусственный трафик выявляется во время антифрод-холда и не оплачивается.',
          'Показывайте автора честно — без вводящего в заблуждение монтажа и вырванного контекста.',
        ] },
        { t: 'takeaways', items: [
          'Клиппинг — это найти лучший момент и сделать из него сильный шортс.',
          'Нужен редактор и один аккаунт в соцсетях — подписчики не требуются.',
          'Сначала правила кампании, потом публикация, ссылка и оплата за подтверждённые просмотры.',
        ] },
      ],
      kk: [
        { t: 'p', x: 'Клиппинг — ұзақ контентті (стримдерді, подкасттарды, сұхбаттарды, музыкалық релиздерді) TikTok, YouTube Shorts және Instagram Reels үшін қысқа тік видеоларға айналдыру. Авторлар мен брендтер өздерінің ең жақсы сәттерінің бәрі жерде бір мезгілде болғанын қалайды және ол үшін клипперлерге ақы төлейді.' },
        { t: 'p', x: 'Clipte-те бәрі қарапайым: автор немесе бренд кампания ашады, сіз олардың контентінен клиптер жариялайсыз және әр расталған қаралым үшін табыс аласыз.' },
        { t: 'h', x: 'Клиппер шын мәнінде не істейді' },
        { t: 'steps', items: [
          ['Сәтті табу', 'Түпнұсқаны қарап, адамдар бөліскісі келетін он секундты табыңыз: реакция, батыл пікір, әзіл, күтпеген бұрылыс.'],
          ['Нақты кесу', 'Сәтке қатысы жоқтың бәрін алып тастаңыз. Кіріспеден емес, әрекеттен бастаңыз.'],
          ['Дыбыссыз да түсінікті ету', 'Таза субтитрлер мен неге соңына дейін көру керектігін түсіндіретін қысқа жазу қосыңыз.'],
          ['Жариялау және жіберу', 'Видеоны қосылған аккаунтқа салып, қаралымдар есептелуі үшін сілтемені кампанияға жіберіңіз.'],
        ] },
        { t: 'h', x: 'Бастау үшін не қажет' },
        { t: 'ul', items: [
          'Телефон немесе компьютер. Көптеген мықты клипперлер тек телефонда монтаждайды.',
          'Өзіңізге ыңғайлы редактор — CapCut, Premiere Pro немесе DaVinci Resolve жарайды.',
          'Кемінде бір платформада аккаунт: TikTok, YouTube Shorts немесе Instagram Reels.',
          'Жазылушылар қажет емес. Clipte-те жазылушылардың ең аз саны жоқ — кампаниялар аудитория көлемі үшін емес, қаралым үшін төлейді.',
          '14 жастан асқан болу. 18 жасқа толмасаңыз, ата-анаңыздың немесе заңды өкіліңіздің рұқсатын алыңыз — төлемдер сонда олар ресімдеген не мақұлдаған әдіске түседі.',
        ] },
        { t: 'h', x: 'Алғашқы кампания қадам бойынша' },
        { t: 'steps', items: [
          ['Аккаунт ашыңыз', 'Тегін тіркеліп, кабинетті ашыңыз.'],
          ['Әлеуметтік желілерді қосыңыз', 'TikTok, Shorts немесе Reels аккаунтын байланыстырыңыз. Верификация бір басуды алады және қаралымдарды дәл сізге есептеуге мүмкіндік береді.'],
          ['Кампания таңдаңыз', 'Монтаждан бұрын брифті және ережелерді оқыңыз: міндетті тегтер, атаулар, тыйым салынған контент және қай платформалар есептеледі.'],
          ['Жариялап, сілтемені жіберіңіз', 'Клипті салып, сілтемесін кампанияға қойыңыз. Есеп осы сәттен басталады.'],
          ['Төлем алыңыз', 'Клиптер 24–48 сағаттық антифрод тексеруден өтеді, содан кейін расталған қаралымдар теңгерімге айналады. Төлемдер апта сайын.'],
        ] },
        { t: 'tip', x: 'Бір платформадан және өзіңіз шынымен көретін бір нишадан бастаңыз. Аудиторияның неге күлетінін білсеңіз, жақсы сәттерді тезірек байқайсыз.' },
        { t: 'h', x: 'Табысыңызды қорғайтын ережелер' },
        { t: 'ul', items: [
          'Кампанияның барлық ережелерін сақтаңыз — міндетті тег немесе атау болмаса, клип есептелмеуі мүмкін.',
          'Тек өз монтажыңызды жүктеңіз. Басқа клипперлердің видеосын қайта салуға болмайды.',
          'Қаралым, лайк немесе жазылушы ешқашан сатып алмаңыз. Жасанды трафик антифрод тексеру кезінде анықталады және төленбейді.',
          'Авторды адал көрсетіңіз — жаңылыстыратын монтаж бен контекстен жұлынған үзінділерсіз.',
        ] },
        { t: 'takeaways', items: [
          'Клиппинг — ең жақсы сәтті тауып, одан мықты шортс жасау.',
          'Редактор мен бір әлеуметтік желі аккаунты жеткілікті — жазылушылар қажет емес.',
          'Алдымен кампания ережелері, содан кейін жариялау, сілтеме және расталған қаралым үшін төлем.',
        ] },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'clipping-side-hustle',
    category: { en: 'Earning', ru: 'Заработок', kk: 'Табыс' },
    minutes: 5,
    updated: '2026-10-11',
    title: {
      en: 'Clipping as a side hustle',
      ru: 'Клиппинг как подработка',
      kk: 'Клиппинг қосымша табыс ретінде',
    },
    excerpt: {
      en: 'How to fit clipping around a job or studies — a weekly rhythm, a fast workflow and honest expectations.',
      ru: 'Как совмещать клиппинг с работой или учёбой: недельный ритм, быстрый процесс и честные ожидания.',
      kk: 'Клиппингті жұмыспен немесе оқумен қалай ұштастыруға болады: апталық ырғақ, жылдам процесс және адал күтулер.',
    },
    body: {
      en: [
        { t: 'p', x: 'Clipping works well as a side hustle because it is flexible: no shifts, no boss, and the work is a list of small, repeatable tasks you can do in short blocks. The catch is that it rewards consistency more than talent — the people who do well post steadily, week after week.' },
        { t: 'h', x: 'Set honest expectations' },
        { t: 'p', x: 'Earnings come from verified views, so they vary from clip to clip and week to week. Some clips will do nothing; one good clip can carry a whole week. Treat the first month as practice: you are learning which moments travel, not chasing a number.' },
        { t: 'h', x: 'A weekly rhythm that fits around a job' },
        { t: 'steps', items: [
          ['One scouting session', 'Once or twice a week, watch new source content and note timestamps of strong moments. Do not edit yet — just collect.'],
          ['Batch your editing', 'Edit several clips in one sitting. Reusing the same caption style and layout makes each clip faster than the last.'],
          ['Schedule your posts', 'Spread uploads across the week instead of dropping everything at once. Steady posting keeps your accounts active.'],
          ['Ten-minute review', 'At the end of the week, check which clips held attention and why. Do more of that next week.'],
        ] },
        { t: 'h', x: 'Build a workflow that saves time' },
        { t: 'ul', items: [
          'Make a caption preset and a text style once, then reuse them on every clip.',
          'Keep a simple log: campaign, clip link, date posted, and anything you learned.',
          'Edit in vertical from the start instead of reframing at the end.',
          'Submit each link to the campaign right after posting so tracking starts immediately.',
        ] },
        { t: 'tip', x: 'Protect your time: pick campaigns whose source you would watch anyway. Scouting stops feeling like work when you enjoy the content.' },
        { t: 'h', x: 'Get paid and stay organised' },
        { t: 'p', x: 'Add your payout method in the dashboard early — PayPal or crypto (USDT, USDC and other supported coins). Clips pass a 24–48 hour anti-fraud hold before views count, and payouts go out weekly. Clipping income is still income, so check how your country expects you to report it.' },
        { t: 'takeaways', items: [
          'Consistency beats talent — post steadily every week.',
          'Scout, batch-edit, schedule, review: a rhythm you can run after work.',
          'Expect variation; treat the first month as practice.',
        ] },
      ],
      ru: [
        { t: 'p', x: 'Клиппинг хорошо подходит как подработка, потому что он гибкий: нет смен и начальника, а работа состоит из небольших повторяющихся задач, которые можно делать короткими блоками. Но есть нюанс: здесь регулярность важнее таланта — успеха добиваются те, кто публикуется стабильно, неделя за неделей.' },
        { t: 'h', x: 'Честные ожидания' },
        { t: 'p', x: 'Доход зависит от подтверждённых просмотров, поэтому он меняется от клипа к клипу и от недели к неделе. Какие-то клипы не наберут ничего, а один удачный может «сделать» всю неделю. Считайте первый месяц практикой: вы учитесь понимать, какие моменты разлетаются, а не гонитесь за цифрой.' },
        { t: 'h', x: 'Недельный ритм рядом с основной работой' },
        { t: 'steps', items: [
          ['Одна сессия поиска', 'Раз или два в неделю смотрите новый контент и записывайте таймкоды сильных моментов. Пока не монтируйте — просто собирайте.'],
          ['Монтаж пачками', 'Монтируйте несколько клипов за один подход. Один и тот же стиль субтитров и раскладка ускоряют каждый следующий клип.'],
          ['Планируйте публикации', 'Распределяйте загрузки по неделе, а не выкладывайте всё сразу. Стабильные публикации держат аккаунты активными.'],
          ['Разбор за десять минут', 'В конце недели посмотрите, какие клипы удерживали внимание и почему. На следующей неделе делайте больше такого.'],
        ] },
        { t: 'h', x: 'Процесс, который экономит время' },
        { t: 'ul', items: [
          'Один раз сделайте пресет субтитров и стиль текста — и используйте их в каждом клипе.',
          'Ведите простой журнал: кампания, ссылка, дата публикации и что вы поняли.',
          'Монтируйте сразу в вертикали, а не перекадрируйте в конце.',
          'Отправляйте ссылку в кампанию сразу после публикации, чтобы учёт начался немедленно.',
        ] },
        { t: 'tip', x: 'Берегите время: выбирайте кампании, исходник которых вы бы и так смотрели. Поиск моментов перестаёт быть работой, когда контент нравится.' },
        { t: 'h', x: 'Выплаты и порядок' },
        { t: 'p', x: 'Добавьте способ выплаты в кабинете заранее — PayPal или криптовалюта (USDT, USDC и другие поддерживаемые монеты). Клипы проходят антифрод-холд 24–48 часов, прежде чем просмотры засчитаются, а выплаты приходят еженедельно. Доход от клиппинга — это всё ещё доход, поэтому уточните, как его нужно декларировать в вашей стране.' },
        { t: 'takeaways', items: [
          'Регулярность важнее таланта — публикуйтесь стабильно каждую неделю.',
          'Поиск, монтаж пачками, план, разбор — ритм, который можно вести после работы.',
          'Доход колеблется; первый месяц — это практика.',
        ] },
      ],
      kk: [
        { t: 'p', x: 'Клиппинг қосымша табыс ретінде жақсы келеді, өйткені ол икемді: ауысым да, бастық та жоқ, ал жұмыс қысқа уақыт аралығында орындауға болатын шағын, қайталанатын тапсырмалардан тұрады. Бірақ бір шарты бар: мұнда тұрақтылық таланттан маңыздырақ — апта сайын тұрақты жариялайтындар табысқа жетеді.' },
        { t: 'h', x: 'Адал күтулер' },
        { t: 'p', x: 'Табыс расталған қаралымдарға байланысты, сондықтан ол клиптен клипке және аптадан аптаға өзгереді. Кейбір клиптер ештеңе жинамайды, ал бір сәтті клип бүкіл аптаны «шығаруы» мүмкін. Алғашқы айды жаттығу деп санаңыз: сіз санды қуалап емес, қай сәттер тарайтынын түсінуді үйренесіз.' },
        { t: 'h', x: 'Негізгі жұмыспен қатар апталық ырғақ' },
        { t: 'steps', items: [
          ['Бір іздеу сессиясы', 'Аптасына бір-екі рет жаңа контентті қарап, мықты сәттердің уақыт белгілерін жазып алыңыз. Әзірге монтаждамаңыз — тек жинаңыз.'],
          ['Топтап монтаждау', 'Бір отырыста бірнеше клип монтаждаңыз. Бірдей субтитр стилі мен орналасу әр келесі клипті жылдамдатады.'],
          ['Жарияланымдарды жоспарлаңыз', 'Бәрін бірден салмай, жүктеулерді аптаға бөліңіз. Тұрақты жарияланым аккаунттарды белсенді ұстайды.'],
          ['Он минуттық талдау', 'Апта соңында қай клиптер назар аударғанын және неге екенін қараңыз. Келесі аптада сондайды көбірек жасаңыз.'],
        ] },
        { t: 'h', x: 'Уақытты үнемдейтін процесс' },
        { t: 'ul', items: [
          'Субтитр пресеті мен мәтін стилін бір рет жасап, әр клипте қолданыңыз.',
          'Қарапайым журнал жүргізіңіз: кампания, сілтеме, жарияланған күн және не түсіндіңіз.',
          'Соңында қайта кадрламай, бірден тік форматта монтаждаңыз.',
          'Есеп бірден басталуы үшін сілтемені жариялағаннан кейін бірден кампанияға жіберіңіз.',
        ] },
        { t: 'tip', x: 'Уақытыңызды қорғаңыз: түпнұсқасын онсыз да көретін кампанияларды таңдаңыз. Контент ұнаса, сәт іздеу жұмыс сияқты сезілмейді.' },
        { t: 'h', x: 'Төлемдер және тәртіп' },
        { t: 'p', x: 'Төлем әдісін кабинетке алдын ала қосыңыз — PayPal немесе криптовалюта (USDT, USDC және басқа қолдау көрсетілетін монеталар). Қаралымдар есептелмес бұрын клиптер 24–48 сағаттық антифрод тексеруден өтеді, ал төлемдер апта сайын жіберіледі. Клиппингтен түскен табыс та табыс, сондықтан оны еліңізде қалай декларациялау керектігін нақтылаңыз.' },
        { t: 'takeaways', items: [
          'Тұрақтылық таланттан маңызды — апта сайын тұрақты жариялаңыз.',
          'Іздеу, топтап монтаждау, жоспар, талдау — жұмыстан кейін жүргізуге болатын ырғақ.',
          'Табыс құбылып тұрады; алғашқы ай — жаттығу.',
        ] },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'youtube-shorts-guide',
    category: { en: 'Platforms', ru: 'Платформы', kk: 'Платформалар' },
    minutes: 6,
    updated: '2026-10-11',
    title: {
      en: 'The YouTube Shorts guide for clippers',
      ru: 'Гайд по YouTube Shorts для клипперов',
      kk: 'Клипперлерге арналған YouTube Shorts нұсқаулығы',
    },
    excerpt: {
      en: 'Format, hooks, titles and the one metric that tells you whether a Short is working.',
      ru: 'Формат, хуки, заголовки и одна метрика, которая показывает, работает ли шортс.',
      kk: 'Формат, хуктар, тақырыптар және шортстың жұмыс істеп тұрғанын көрсететін бір метрика.',
    },
    body: {
      en: [
        { t: 'p', x: 'YouTube Shorts sits inside the world’s biggest video platform, which makes it a strong home for clips from long-form creators — viewers who like a Short can fall straight into the full video. Here is how to make clips that hold up there.' },
        { t: 'h', x: 'Get the format right' },
        { t: 'ul', items: [
          'Vertical 9:16, full resolution. Letterboxed horizontal clips look unfinished in the feed.',
          'Shorts can now run up to three minutes, but most clips perform best when they are only as long as the moment.',
          'Keep faces and captions away from the bottom and right edges, where the interface covers the video.',
        ] },
        { t: 'h', x: 'Win the first second' },
        { t: 'p', x: 'People decide almost instantly whether to keep watching or swipe. Open on the most interesting frame — the reaction, the question, the claim — and save context for later. If the first line someone hears is a greeting, you have already lost them.' },
        { t: 'h', x: 'Titles and captions that help' },
        { t: 'ul', items: [
          'Write a title that adds curiosity, not one that repeats what is on screen.',
          'Burn in captions — a large share of viewers watch with the sound off.',
          'Use the creator’s name or show where it helps discovery and the campaign allows it.',
          'Add the tags or mentions the campaign requires — check the brief every time.',
        ] },
        { t: 'tip', x: 'Design for the loop. If the last second flows naturally back into the first, viewers often watch twice — and replays count as views.' },
        { t: 'h', x: 'Read your analytics' },
        { t: 'p', x: 'In YouTube Studio, the number to watch for Shorts is how many people chose to view versus swiped away. A clip that keeps viewers in the opening seconds will be shown to more people; one that loses them early will not, no matter how good the ending is. Compare your best and worst clips and look at what happened in their first two seconds.' },
        { t: 'h', x: 'Shorts on Clipte' },
        { t: 'p', x: 'Connect your YouTube channel in the dashboard, post your Short, then submit its link to the campaign. Views are verified after the 24–48 hour anti-fraud hold, and only views on clips that follow the campaign rules are paid.' },
        { t: 'takeaways', items: [
          '9:16, safe zones respected, as long as the moment and no longer.',
          'Open on the strongest frame; captions on.',
          'Track viewed vs. swiped away — it tells you what to fix.',
        ] },
      ],
      ru: [
        { t: 'p', x: 'YouTube Shorts живёт внутри крупнейшей видеоплатформы в мире, поэтому это отличное место для клипов из длинного контента: зритель, которому понравился шортс, может сразу перейти к полному видео. Вот как делать клипы, которые там работают.' },
        { t: 'h', x: 'Правильный формат' },
        { t: 'ul', items: [
          'Вертикаль 9:16 в полном разрешении. Горизонтальные клипы с чёрными полосами выглядят в ленте незаконченными.',
          'Shorts теперь могут длиться до трёх минут, но большинство клипов работают лучше, когда они не длиннее самого момента.',
          'Держите лица и субтитры подальше от нижнего и правого краёв — там видео перекрывает интерфейс.',
        ] },
        { t: 'h', x: 'Выиграйте первую секунду' },
        { t: 'p', x: 'Зритель почти мгновенно решает, смотреть дальше или листать. Начинайте с самого интересного кадра — реакции, вопроса, заявления — а контекст оставьте на потом. Если первое, что человек слышит, — приветствие, вы его уже потеряли.' },
        { t: 'h', x: 'Заголовки и субтитры, которые помогают' },
        { t: 'ul', items: [
          'Пишите заголовок, который добавляет интригу, а не повторяет то, что на экране.',
          'Вшивайте субтитры — значительная часть зрителей смотрит без звука.',
          'Указывайте имя автора или шоу, если это помогает поиску и разрешено кампанией.',
          'Добавляйте теги и упоминания, которые требует кампания, — каждый раз сверяйтесь с брифом.',
        ] },
        { t: 'tip', x: 'Делайте клип зацикленным. Если последняя секунда естественно перетекает в первую, зрители часто смотрят дважды — а повторы тоже считаются просмотрами.' },
        { t: 'h', x: 'Читайте аналитику' },
        { t: 'p', x: 'В YouTube Studio для Shorts главная цифра — сколько людей решили смотреть, а сколько пролистали. Клип, который удерживает зрителей в первые секунды, покажут большему числу людей; тот, что теряет их сразу, — нет, каким бы хорошим ни был финал. Сравните лучшие и худшие клипы и посмотрите, что происходило в их первые две секунды.' },
        { t: 'h', x: 'Shorts в Clipte' },
        { t: 'p', x: 'Подключите YouTube-канал в кабинете, опубликуйте шортс и отправьте ссылку в кампанию. Просмотры подтверждаются после антифрод-холда 24–48 часов, и оплачиваются только просмотры клипов, соблюдающих правила кампании.' },
        { t: 'takeaways', items: [
          '9:16, безопасные зоны соблюдены, длина — как у момента, не больше.',
          'Начинайте с сильнейшего кадра; субтитры обязательны.',
          'Следите за «посмотрели / пролистали» — это показывает, что исправить.',
        ] },
      ],
      kk: [
        { t: 'p', x: 'YouTube Shorts әлемдегі ең ірі видеоплатформаның ішінде орналасқан, сондықтан ол ұзақ контенттен жасалған клиптерге тамаша орын: шортс ұнаған көрермен бірден толық видеоға өте алады. Онда жұмыс істейтін клиптерді қалай жасау керектігі төменде.' },
        { t: 'h', x: 'Дұрыс формат' },
        { t: 'ul', items: [
          'Толық ажыратымдылықтағы 9:16 тік формат. Қара жолақты көлденең клиптер лентада аяқталмаған болып көрінеді.',
          'Shorts енді үш минутқа дейін созыла алады, бірақ клиптердің көбі сәттің өзінен ұзын болмағанда жақсы жұмыс істейді.',
          'Беттер мен субтитрлерді төменгі және оң жақ шеттерден алыс ұстаңыз — ол жерде видеоны интерфейс жабады.',
        ] },
        { t: 'h', x: 'Бірінші секундты ұтыңыз' },
        { t: 'p', x: 'Көрермен әрі қарай көру немесе айналдыру туралы бірден дерлік шешеді. Ең қызықты кадрдан — реакциядан, сұрақтан, мәлімдемеден бастаңыз, ал контекстті кейінге қалдырыңыз. Адам еститін бірінші сөз сәлемдесу болса, сіз оны жоғалтып алдыңыз.' },
        { t: 'h', x: 'Көмектесетін тақырыптар мен субтитрлер' },
        { t: 'ul', items: [
          'Экрандағыны қайталамай, қызығушылық тудыратын тақырып жазыңыз.',
          'Субтитрлерді видеоға енгізіңіз — көрермендердің едәуір бөлігі дыбыссыз көреді.',
          'Іздеуге көмектессе және кампания рұқсат етсе, автордың немесе шоудың атын көрсетіңіз.',
          'Кампания талап ететін тегтер мен атауларды қосыңыз — әр жолы брифті тексеріңіз.',
        ] },
        { t: 'tip', x: 'Клипті тұйықталған етіп жасаңыз. Соңғы секунд бірінші секундқа табиғи жалғасса, көрермендер жиі екі рет көреді — ал қайта көрулер де қаралым болып есептеледі.' },
        { t: 'h', x: 'Аналитиканы оқыңыз' },
        { t: 'p', x: 'YouTube Studio-да Shorts үшін басты көрсеткіш — қанша адам көруді таңдады, ал қаншасы айналдырып жіберді. Алғашқы секундтарда көрермендерді ұстайтын клипті көбірек адамға көрсетеді; оларды бірден жоғалтатын клипті — жоқ, финалы қаншалықты жақсы болса да. Ең жақсы және ең нашар клиптеріңізді салыстырып, олардың алғашқы екі секундында не болғанын қараңыз.' },
        { t: 'h', x: 'Clipte-тегі Shorts' },
        { t: 'p', x: 'Кабинетте YouTube арнаңызды қосыңыз, шортсты жариялап, сілтемесін кампанияға жіберіңіз. Қаралымдар 24–48 сағаттық антифрод тексеруден кейін расталады, және тек кампания ережелерін сақтайтын клиптердің қаралымдары төленеді.' },
        { t: 'takeaways', items: [
          '9:16, қауіпсіз аймақтар сақталған, ұзындығы — сәттің өзіндей, артық емес.',
          'Ең мықты кадрдан бастаңыз; субтитрлер міндетті.',
          '«Көрді / айналдырды» көрсеткішін бақылаңыз — не түзету керектігін сол көрсетеді.',
        ] },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'instagram-reels-guide',
    category: { en: 'Platforms', ru: 'Платформы', kk: 'Платформалар' },
    minutes: 5,
    updated: '2026-10-11',
    title: {
      en: 'The Instagram Reels guide for clippers',
      ru: 'Гайд по Instagram Reels для клипперов',
      kk: 'Клипперлерге арналған Instagram Reels нұсқаулығы',
    },
    excerpt: {
      en: 'Covers, on-screen text, sends and saves — what makes a Reel spread beyond your followers.',
      ru: 'Обложки, текст на экране, репосты и сохранения — что помогает Reels выйти за пределы подписчиков.',
      kk: 'Мұқабалар, экрандағы мәтін, бөлісулер мен сақтаулар — Reels-ті жазылушылардан тыс таратуға не көмектеседі.',
    },
    body: {
      en: [
        { t: 'p', x: 'Instagram Reels rewards clips that people send to friends and save for later. That makes it a great fit for punchlines, hot takes and quotable moments — the kind of clip someone shares in a group chat with “you need to see this”.' },
        { t: 'h', x: 'Format and safe zones' },
        { t: 'ul', items: [
          'Vertical 9:16. Reels can run up to three minutes, but tight clips travel further.',
          'Keep key text in the middle of the frame — the caption, buttons and username cover the bottom and right.',
          'Remember the grid crops your cover to a smaller ratio, so keep the subject centred.',
        ] },
        { t: 'h', x: 'Covers and on-screen text' },
        { t: 'p', x: 'Pick a cover frame with a clear face or a readable line of text — it is what people see on your profile and in Explore. Add one short line of on-screen text in the first second that says what the clip is about, written the way a friend would say it.' },
        { t: 'h', x: 'Make it shareable' },
        { t: 'ul', items: [
          'Aim for “send this to someone” moments: relatable, surprising or quotable.',
          'Write a short caption that invites a reaction, then add the campaign’s required tags and mentions.',
          'Use a handful of relevant hashtags rather than a wall of them.',
          'Keep the original audio when the moment depends on it; music should never bury the dialogue.',
        ] },
        { t: 'tip', x: 'Where your account has it, Trial Reels let you show a clip to non-followers first. It is a low-risk way to test two cuts of the same moment.' },
        { t: 'h', x: 'What to watch in insights' },
        { t: 'p', x: 'Look at shares, saves and how long people watched — not just likes. A Reel with modest likes but lots of sends is a sign you found the right kind of moment; make more like it.' },
        { t: 'h', x: 'Reels on Clipte' },
        { t: 'p', x: 'Connect your Instagram account in the dashboard, post your Reel and submit the link to the campaign. After the 24–48 hour anti-fraud hold, verified views on rule-following clips are added to your balance.' },
        { t: 'takeaways', items: [
          'Centre your subject and text; mind the interface overlays.',
          'Strong cover, one clear line of on-screen text.',
          'Sends and saves are the signal — chase shareable moments.',
        ] },
      ],
      ru: [
        { t: 'p', x: 'Instagram Reels вознаграждает клипы, которые пересылают друзьям и сохраняют. Поэтому он отлично подходит для панчлайнов, острых мнений и цитат — таких клипов, которые кидают в общий чат со словами «ты должен это увидеть».' },
        { t: 'h', x: 'Формат и безопасные зоны' },
        { t: 'ul', items: [
          'Вертикаль 9:16. Reels могут длиться до трёх минут, но короткие клипы расходятся дальше.',
          'Держите важный текст в центре кадра — подпись, кнопки и ник перекрывают низ и правую часть.',
          'Сетка профиля обрезает обложку до меньшего формата, поэтому держите объект по центру.',
        ] },
        { t: 'h', x: 'Обложки и текст на экране' },
        { t: 'p', x: 'Выбирайте кадр обложки с чётким лицом или читаемой фразой — именно его видят в профиле и в «Интересном». Добавьте в первую секунду одну короткую строку текста о том, про что клип, — так, как сказал бы друг.' },
        { t: 'h', x: 'Сделайте клип таким, чтобы им делились' },
        { t: 'ul', items: [
          'Ищите моменты «перешли кому-нибудь»: узнаваемые, неожиданные или цитатные.',
          'Пишите короткую подпись, которая вызывает реакцию, и добавляйте обязательные теги и упоминания кампании.',
          'Используйте несколько релевантных хэштегов, а не целую стену.',
          'Оставляйте оригинальный звук, если момент на нём держится; музыка не должна заглушать речь.',
        ] },
        { t: 'tip', x: 'Если в вашем аккаунте есть пробные Reels, ими можно сначала показать клип тем, кто на вас не подписан. Это безопасный способ протестировать два варианта монтажа одного момента.' },
        { t: 'h', x: 'На что смотреть в статистике' },
        { t: 'p', x: 'Смотрите на репосты, сохранения и время просмотра — не только на лайки. Reels со скромными лайками, но большим числом пересылок — знак, что вы нашли правильный тип момента; делайте больше таких.' },
        { t: 'h', x: 'Reels в Clipte' },
        { t: 'p', x: 'Подключите аккаунт Instagram в кабинете, опубликуйте Reels и отправьте ссылку в кампанию. После антифрод-холда 24–48 часов подтверждённые просмотры клипов, соблюдающих правила, добавляются к вашему балансу.' },
        { t: 'takeaways', items: [
          'Объект и текст — по центру; учитывайте элементы интерфейса.',
          'Сильная обложка и одна понятная строка текста на экране.',
          'Пересылки и сохранения — главный сигнал; ищите моменты, которыми делятся.',
        ] },
      ],
      kk: [
        { t: 'p', x: 'Instagram Reels достарға жіберілетін және сақталатын клиптерді жоғары бағалайды. Сондықтан ол әзілдерге, батыл пікірлерге және дәйексөз болатын сәттерге өте жақсы келеді — ортақ чатқа «мұны көруің керек» деп жіберетін клиптерге.' },
        { t: 'h', x: 'Формат және қауіпсіз аймақтар' },
        { t: 'ul', items: [
          '9:16 тік формат. Reels үш минутқа дейін созыла алады, бірақ қысқа клиптер алысқа таралады.',
          'Маңызды мәтінді кадрдың ортасында ұстаңыз — жазба, түймелер және ник төменгі және оң жақ бөлікті жабады.',
          'Профиль торы мұқабаны кішірек форматқа қиып тастайды, сондықтан нысанды ортада ұстаңыз.',
        ] },
        { t: 'h', x: 'Мұқабалар және экрандағы мәтін' },
        { t: 'p', x: 'Мұқабаға анық бет немесе оқылатын сөз тіркесі бар кадрды таңдаңыз — профильде және «Қызықты» бөлімінде дәл соны көреді. Бірінші секундқа клип не туралы екенін айтатын бір қысқа жол қосыңыз — досыңыз айтқандай етіп.' },
        { t: 'h', x: 'Бөлісуге лайық клип жасаңыз' },
        { t: 'ul', items: [
          '«Біреуге жібер» сәттерін іздеңіз: таныс, күтпеген немесе дәйексөз болатын.',
          'Реакция тудыратын қысқа жазба жазып, кампанияның міндетті тегтері мен атауларын қосыңыз.',
          'Тұтас қабырға емес, бірнеше өзекті хэштег қолданыңыз.',
          'Сәт соған сүйенсе, түпнұсқа дыбысты қалдырыңыз; музыка сөзді басып кетпеуі керек.',
        ] },
        { t: 'tip', x: 'Аккаунтыңызда сынақ Reels бар болса, олармен клипті алдымен сізге жазылмағандарға көрсетуге болады. Бұл бір сәттің екі монтаж нұсқасын тексерудің қауіпсіз жолы.' },
        { t: 'h', x: 'Статистикада неге қарау керек' },
        { t: 'p', x: 'Тек лайктарға емес, бөлісулерге, сақтауларға және көру уақытына қараңыз. Лайктары аз, бірақ жіберулері көп Reels — дұрыс сәт түрін тапқаныңыздың белгісі; сондайды көбірек жасаңыз.' },
        { t: 'h', x: 'Clipte-тегі Reels' },
        { t: 'p', x: 'Кабинетте Instagram аккаунтыңызды қосыңыз, Reels жариялап, сілтемесін кампанияға жіберіңіз. 24–48 сағаттық антифрод тексеруден кейін ережелерді сақтайтын клиптердің расталған қаралымдары теңгеріміңізге қосылады.' },
        { t: 'takeaways', items: [
          'Нысан мен мәтін — ортада; интерфейс элементтерін ескеріңіз.',
          'Мықты мұқаба және экранда бір түсінікті жол.',
          'Жіберулер мен сақтаулар — басты белгі; бөлісетін сәттерді іздеңіз.',
        ] },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'best-practices',
    category: { en: 'Craft', ru: 'Мастерство', kk: 'Шеберлік' },
    minutes: 7,
    updated: '2026-10-11',
    title: {
      en: 'Clipping best practices',
      ru: 'Лучшие практики клиппинга',
      kk: 'Клиппингтің үздік тәжірибелері',
    },
    excerpt: {
      en: 'The habits behind clips that perform: choosing moments, pacing, captions, sound and staying eligible.',
      ru: 'Привычки, на которых держатся успешные клипы: выбор момента, темп, субтитры, звук и соблюдение правил.',
      kk: 'Сәтті клиптердің артындағы әдеттер: сәт таңдау, қарқын, субтитрлер, дыбыс және ережелерді сақтау.',
    },
    body: {
      en: [
        { t: 'p', x: 'Great clips are rarely about fancy effects. They come from choosing the right moment and removing everything that gets in its way. These are the habits we see behind clips that keep performing.' },
        { t: 'h', x: 'Choose moments, not topics' },
        { t: 'p', x: 'A topic is “they talked about money”. A moment is the exact sentence where someone says something surprising about money. Clip moments with a clear turn — a reveal, a disagreement, a punchline, a strong reaction — and the clip will explain itself.' },
        { t: 'h', x: 'Pacing' },
        { t: 'ul', items: [
          'Cut the silence, the “um”s and the slow wind-up. Start one beat before the payoff.',
          'Change something on screen every few seconds — a zoom, a caption, a new angle — to keep attention.',
          'End right after the payoff. Lingering is where viewers swipe away.',
        ] },
        { t: 'h', x: 'Captions and text' },
        { t: 'ul', items: [
          'Big, high-contrast captions, two or three words at a time, synced to speech.',
          'One headline line at the top that frames the moment.',
          'Check spelling and names — mistakes cost credibility and can break campaign rules.',
        ] },
        { t: 'h', x: 'Sound' },
        { t: 'p', x: 'Dialogue first. Normalise the voice so it is clear on phone speakers, keep background music low, and avoid tracks you do not have the right to use — a muted clip earns nothing.' },
        { t: 'tip', x: 'Before posting, watch your clip once on mute and once with sound on a phone. If it does not work both ways, fix it.' },
        { t: 'h', x: 'Stay eligible' },
        { t: 'ul', items: [
          'Read the campaign brief every time: required tags, mentions, links, banned topics and allowed platforms.',
          'Post original edits only, from accounts you connected to Clipte.',
          'Never use bots, view farms or engagement groups — the 24–48 hour anti-fraud hold exists to catch them, and flagged views are not paid.',
          'Respect the creator: no misleading cuts, fake context or edits that put words in someone’s mouth.',
        ] },
        { t: 'h', x: 'Improve every week' },
        { t: 'p', x: 'Keep a short log of what you posted and how it did. Once a week, compare your best and worst clips: what was in the first two seconds, how long were they, what was the caption? Small, deliberate changes compound quickly.' },
        { t: 'takeaways', items: [
          'Clip moments with a clear turn; cut everything around them.',
          'Readable captions, clear dialogue, quick ending.',
          'Follow the brief and keep it clean — only eligible views are paid.',
        ] },
      ],
      ru: [
        { t: 'p', x: 'Сильные клипы редко держатся на эффектах. Они получаются, когда выбран правильный момент и убрано всё, что ему мешает. Вот привычки, которые мы видим за клипами, стабильно набирающими просмотры.' },
        { t: 'h', x: 'Выбирайте моменты, а не темы' },
        { t: 'p', x: 'Тема — это «говорили про деньги». Момент — это та самая фраза, где человек говорит о деньгах что-то неожиданное. Режьте моменты с явным поворотом — раскрытием, спором, панчлайном, сильной реакцией — и клип объяснит себя сам.' },
        { t: 'h', x: 'Темп' },
        { t: 'ul', items: [
          'Вырезайте паузы, «эээ» и долгую подводку. Начинайте за мгновение до кульминации.',
          'Меняйте что-то на экране каждые несколько секунд — зум, субтитр, ракурс, — чтобы удерживать внимание.',
          'Заканчивайте сразу после кульминации. Затянутый финал — место, где зрители листают дальше.',
        ] },
        { t: 'h', x: 'Субтитры и текст' },
        { t: 'ul', items: [
          'Крупные контрастные субтитры по два-три слова, синхронно с речью.',
          'Одна строка-заголовок сверху, которая задаёт контекст момента.',
          'Проверяйте орфографию и имена — ошибки бьют по доверию и могут нарушить правила кампании.',
        ] },
        { t: 'h', x: 'Звук' },
        { t: 'p', x: 'Сначала речь. Выровняйте громкость голоса, чтобы его было хорошо слышно в динамике телефона, держите фоновую музыку тихой и не используйте треки, на которые у вас нет прав, — заглушённый клип ничего не заработает.' },
        { t: 'tip', x: 'Перед публикацией посмотрите клип на телефоне один раз без звука и один раз со звуком. Если он не работает в обоих вариантах — доработайте.' },
        { t: 'h', x: 'Соблюдайте правила' },
        { t: 'ul', items: [
          'Каждый раз читайте бриф кампании: обязательные теги, упоминания, ссылки, запрещённые темы и разрешённые платформы.',
          'Публикуйте только свой монтаж и только с аккаунтов, подключённых к Clipte.',
          'Никогда не используйте ботов, фермы просмотров и группы взаимной активности — антифрод-холд 24–48 часов создан, чтобы их выявлять, и такие просмотры не оплачиваются.',
          'Уважайте автора: без вводящего в заблуждение монтажа, ложного контекста и «вложенных в рот» слов.',
        ] },
        { t: 'h', x: 'Становитесь лучше каждую неделю' },
        { t: 'p', x: 'Ведите короткий журнал: что опубликовали и как это сработало. Раз в неделю сравнивайте лучшие и худшие клипы: что было в первые две секунды, какой длины они были, какая стояла надпись? Небольшие осознанные изменения быстро дают результат.' },
        { t: 'takeaways', items: [
          'Режьте моменты с явным поворотом и убирайте всё лишнее вокруг.',
          'Читаемые субтитры, чистая речь, быстрый финал.',
          'Следуйте брифу и играйте честно — оплачиваются только засчитанные просмотры.',
        ] },
      ],
      kk: [
        { t: 'p', x: 'Мықты клиптер сирек жағдайда эффектілерге сүйенеді. Олар дұрыс сәт таңдалып, оған кедергі келтіретіннің бәрі алынып тасталғанда шығады. Тұрақты түрде қаралым жинайтын клиптердің артындағы әдеттер мыналар.' },
        { t: 'h', x: 'Тақырыпты емес, сәтті таңдаңыз' },
        { t: 'p', x: 'Тақырып — «ақша туралы айтты». Сәт — адам ақша туралы күтпеген нәрсе айтқан дәл сол сөйлем. Айқын бұрылысы бар сәттерді — ашылуды, дауды, әзілді, күшті реакцияны — кесіңіз, сонда клип өзін-өзі түсіндіреді.' },
        { t: 'h', x: 'Қарқын' },
        { t: 'ul', items: [
          'Үзілістерді, «ммм» дегендерді және ұзақ кіріспені алып тастаңыз. Шарықтау шегінен бір сәт бұрын бастаңыз.',
          'Назарды ұстау үшін экранда бірнеше секунд сайын бір нәрсені өзгертіңіз — зум, субтитр, ракурс.',
          'Шарықтау шегінен кейін бірден аяқтаңыз. Созылған финал — көрермендер айналдырып кететін жер.',
        ] },
        { t: 'h', x: 'Субтитрлер мен мәтін' },
        { t: 'ul', items: [
          'Сөзбен синхронды, екі-үш сөзден тұратын ірі, контрасты субтитрлер.',
          'Сәттің контекстін беретін жоғарыдағы бір тақырып жолы.',
          'Емле мен есімдерді тексеріңіз — қателер сенімге нұқсан келтіреді және кампания ережелерін бұзуы мүмкін.',
        ] },
        { t: 'h', x: 'Дыбыс' },
        { t: 'p', x: 'Алдымен сөз. Дауысты телефон динамигінде анық естілетіндей теңестіріңіз, фондық музыканы ақырын ұстаңыз және құқығыңыз жоқ тректерді қолданбаңыз — дыбысы өшірілген клип ештеңе таппайды.' },
        { t: 'tip', x: 'Жарияламас бұрын клипті телефоннан бір рет дыбыссыз, бір рет дыбыспен көріңіз. Екі жағдайда да жұмыс істемесе — жетілдіріңіз.' },
        { t: 'h', x: 'Ережелерді сақтаңыз' },
        { t: 'ul', items: [
          'Кампания брифін әр жолы оқыңыз: міндетті тегтер, атаулар, сілтемелер, тыйым салынған тақырыптар және рұқсат етілген платформалар.',
          'Тек өз монтажыңызды және тек Clipte-ке қосылған аккаунттардан жариялаңыз.',
          'Боттарды, қаралым фермаларын және өзара белсенділік топтарын ешқашан қолданбаңыз — 24–48 сағаттық антифрод тексеру оларды анықтау үшін бар, және ондай қаралымдар төленбейді.',
          'Авторды құрметтеңіз: жаңылыстыратын монтажсыз, жалған контекстсіз және біреудің аузына сөз салмай.',
        ] },
        { t: 'h', x: 'Апта сайын жақсарыңыз' },
        { t: 'p', x: 'Не жариялағаныңыз және оның қалай болғаны туралы қысқа журнал жүргізіңіз. Аптасына бір рет ең жақсы және ең нашар клиптерді салыстырыңыз: алғашқы екі секундта не болды, олардың ұзындығы қандай, қандай жазу тұрды? Шағын, саналы өзгерістер тез нәтиже береді.' },
        { t: 'takeaways', items: [
          'Айқын бұрылысы бар сәттерді кесіп, айналасындағы артықтың бәрін алыңыз.',
          'Оқылатын субтитрлер, таза сөз, жылдам финал.',
          'Брифті сақтап, адал болыңыз — тек есептелген қаралымдар төленеді.',
        ] },
      ],
    },
  },
];

/** Reading order: the earnings guide follows "How to become a clipper". */
export const GUIDES: Guide[] = [BASE_GUIDES[0], EARNINGS_GUIDE, ...BASE_GUIDES.slice(1)];

/** Guides listed before they are written (none right now). */
export const UPCOMING_GUIDES: { slug: string; title: L<string>; category: L<string> }[] = [];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
