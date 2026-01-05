export type OrganizationSeed = {
  key: string;
  parentKey?: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  logoUrl?: string;
};

export const iranianGovernmentOrganizations: OrganizationSeed[] = [
  {
    key: 'iri_government',
    name: 'جمهوری اسلامی ایران',
    nameEn: 'Islamic Republic of Iran',
    description:
      'ساختار مرکزی حاکمیت که تمامی نهادهای سیاسی، نظامی و اداری کشور را زیر چتر واحد خود هماهنگ می‌کند و از قانون اساسی ۱۳۵۸ تبعیت می‌کند.',
    descriptionEn:
      'Central governing structure that coordinates all political, military, and administrative institutions under the post-1979 constitution.',
  },
  {
    key: 'supreme_leader_office',
    parentKey: 'iri_government',
    name: 'دفتر مقام معظم رهبری',
    nameEn: 'Office of the Supreme Leader',
    description:
      'نهاد اجرایی و اداری که دستورات و سیاست‌های رهبری را به سایر ارگان‌ها ابلاغ و بر اجرای آن نظارت می‌کند.',
    descriptionEn:
      'Executive and administrative body that communicates the Supreme Leader’s directives and supervises compliance across dependent institutions.',
  },
  {
    key: 'assembly_of_experts',
    parentKey: 'iri_government',
    name: 'مجلس خبرگان رهبری',
    nameEn: 'Assembly of Experts',
    description:
      'نهاد منتخب خبرگان دینی برای انتخاب، نظارت و ـ در موارد استثنایی ـ عزل رهبر طبق قانون اساسی.',
    descriptionEn:
      'Elected clerical body empowered to select, supervise, and if necessary dismiss the Supreme Leader under the constitution.',
  },
  {
    key: 'expediency_council',
    parentKey: 'supreme_leader_office',
    name: 'مجمع تشخیص مصلحت نظام',
    nameEn: 'Expediency Discernment Council',
    description:
      'نهادی برای حل اختلاف میان مجلس و شورای نگهبان و تدوین سیاست‌های کلان در چارچوب دستورات رهبری.',
    descriptionEn:
      'Advisory body that resolves disputes between parliament and the Guardian Council and drafts macro policies for the Supreme Leader.',
  },
  {
    key: 'guardian_council',
    parentKey: 'supreme_leader_office',
    name: 'شورای نگهبان',
    nameEn: 'Guardian Council',
    description:
      'شورا با ترکیب فقیهان منصوب رهبری و حقوقدانان منتخب مجلس، نظارت شرعی و قانونی بر مصوبات مجلس و انتخابات را بر عهده دارد.',
    descriptionEn:
      'Council of jurists and clerics that vets legislation and elections for compliance with Islamic law and the constitution.',
  },
  {
    key: 'supreme_national_security_council',
    parentKey: 'supreme_leader_office',
    name: 'شورای عالی امنیت ملی',
    nameEn: 'Supreme National Security Council',
    description:
      'شورای هماهنگ‌کننده سیاست‌های دفاعی، امنیتی و سیاست خارجی با عضویت رؤسای قوا و مسئولان ارشد نظامی و امنیتی.',
    descriptionEn:
      'High council aligning defense, security, and foreign policy with participation from heads of branches and senior security chiefs.',
  },
  {
    key: 'executive_branch',
    parentKey: 'iri_government',
    name: 'قوه مجریه',
    nameEn: 'Executive Branch',
    description:
      'شبکه‌ای از وزارتخانه‌ها و سازمان‌های زیر نظر رئیس‌جمهور که سیاست‌های اجرایی و خدمات عمومی را پیاده می‌کنند.',
    descriptionEn:
      'Network of ministries and agencies under the president responsible for implementing policy and delivering public services.',
  },
  {
    key: 'presidency_institution',
    parentKey: 'executive_branch',
    name: 'نهاد ریاست جمهوری',
    nameEn: 'Presidency Institution',
    description:
      'دفتر و معاونت‌های مستقیم ریاست‌جمهوری شامل برنامه‌ریزی، روابط عمومی و مدیریت جلسات هیئت دولت.',
    descriptionEn:
      'President’s office and deputyships managing policy planning, communications, and cabinet coordination.',
  },
  {
    key: 'cabinet_secretariat',
    parentKey: 'executive_branch',
    name: 'دبیرخانه هیئت دولت',
    nameEn: 'Cabinet Secretariat',
    description:
      'واحد برنامه‌ریزی و پیگیری مصوبات هیئت دولت که مصوبات اجرایی را به دستگاه‌ها ابلاغ می‌کند.',
    descriptionEn:
      'Planning and follow-up unit that manages cabinet agendas and circulates executive decrees to ministries.',
  },
  {
    key: 'plan_budget_org',
    parentKey: 'executive_branch',
    name: 'سازمان برنامه و بودجه کشور',
    nameEn: 'Plan and Budget Organization',
    description:
      'نهاد مسئول تهیه برنامه‌های بلندمدت و پنج‌ساله توسعه، تنظیم بودجه کل کشور و نظارت بر اجرای پروژه‌های اولویت‌دار.',
    descriptionEn:
      'Agency that prepares long‑term and five‑year development plans, drafts the national budget, and monitors the implementation of priority projects and policies.',
  },
  {
    key: 'administrative_org',
    parentKey: 'executive_branch',
    name: 'سازمان اداری و استخدامی کشور',
    nameEn: 'Administrative and Recruitment Organization',
    description:
      'مسئول اصلاحات اداری و منابع انسانی، طبقه‌بندی مشاغل، ارزیابی عملکرد و انجام مطالعات علمی درباره ساختار و وظایف دستگاه‌های دولتی.',
    descriptionEn:
      'Carries out administrative reforms and human‑resources policies across the civil service, including classification of posts, performance evaluation, and studies on the macro‑structure and functions of government bodies.',
  },
  {
    key: 'ministry_interior',
    parentKey: 'executive_branch',
    name: 'وزارت کشور',
    nameEn: 'Ministry of Interior',
    description:
      'هماهنگ‌کننده امور استانداری‌ها و فرمانداری‌ها، امنیت داخلی و همکاری با نهادهای اطلاعاتی و انتظامی؛ برگزارکننده انتخابات، ناظر بر شوراهای اسلامی، سامان‌دهی اتباع خارجی و توسعه محلی و مدیریت بحران.',
    descriptionEn:
      'Coordinates provincial governance, domestic security, policing, and intelligence cooperation; manages elections, supervises governors and Islamic councils, oversees foreign nationals and development programmes, and directs crisis and disaster management.',
  },
  {
    key: 'ministry_intelligence',
    parentKey: 'executive_branch',
    name: 'وزارت اطلاعات',
    nameEn: 'Ministry of Intelligence',
    description:
      'سازمان اطلاعاتی و ضدجاسوسی مرکزی که از سال ۱۳۶۳ برای حفظ امنیت داخلی و شناسایی تهدیدها (به‌جز حوزه نظامی) در داخل و خارج فعالیت می‌کند.',
    descriptionEn:
      'Central civilian intelligence and counter‑espionage agency created in 1984 to safeguard internal security and conduct strategic reconnaissance (excluding military intelligence) at home and abroad.',
  },
  {
    key: 'ministry_foreign_affairs',
    parentKey: 'executive_branch',
    name: 'وزارت امور خارجه',
    nameEn: 'Ministry of Foreign Affairs',
    description:
      'بازوی دیپلماسی دولت برای تدوین و اجرای سیاست خارجی، مدیریت روابط و مذاکرات بین‌المللی و سرپرستی سفارتخانه‌ها و نمایندگی‌ها در چارچوب خط مشی تعیین‌شده توسط رهبری.',
    descriptionEn:
      'Diplomatic arm of the government that formulates and communicates foreign policy, manages international relations and treaties, and oversees embassies and missions within a framework set by the Supreme Leader.',
  },
  {
    key: 'ministry_defense',
    parentKey: 'executive_branch',
    name: 'وزارت دفاع و پشتیبانی نیروهای مسلح',
    nameEn: 'Ministry of Defense and Armed Forces Logistics',
    description:
      'وزارتخانه‌ای که پشتیبانی لجستیکی و اداری نیروهای نظامی را بر عهده داشته و مدیریت تحقیقات و تولیدات نظامی و موشکی و صنایع دفاعی دولتی را بر عهده دارد.',
    descriptionEn:
      'Ministry that manages logistics and administrative support for Iran’s regular military and the IRGC, oversees defence research and development, and directs state‑owned arms industries including missile and other weapons programmes.',
  },
  {
    key: 'ministry_oil',
    parentKey: 'executive_branch',
    name: 'وزارت نفت',
    nameEn: 'Ministry of Petroleum',
    description:
      'مسئول نظارت بر اکتشاف، استخراج، پالایش، بازاریابی و صادرات نفت خام، گاز طبیعی و محصولات پتروشیمی از طریق شرکت‌های ملی و سیاستگذاری تولید و صادرات انرژی.',
    descriptionEn:
      'Responsible for exploration, extraction, refining, marketing and export of crude oil, natural gas and petrochemical products through state companies such as the National Iranian Oil Company, and for setting energy production and export policy.',
  },
  {
    key: 'ministry_industry',
    parentKey: 'executive_branch',
    name: 'وزارت صنعت، معدن و تجارت',
    nameEn: 'Ministry of Industry, Mine and Trade',
    description:
      'هماهنگ‌کننده توسعه صنعتی و تجاری، تعیین سیاست‌ها و استانداردهای معدنی، صدور مجوزهای اکتشاف و بهره‌برداری، نظارت بر واحدهای صنعتی و معدنی و تنظیم تجارت داخلی و خارجی.',
    descriptionEn:
      'Coordinates industrial and commercial development, formulates policies and standards for mines, issues exploration and operation licences, supervises industrial and mining facilities, and regulates domestic and international trade.',
  },
  {
    key: 'ministry_culture',
    parentKey: 'executive_branch',
    name: 'وزارت فرهنگ و ارشاد اسلامی',
    nameEn: 'Ministry of Culture and Islamic Guidance',
    description:
      'نهاد تنظیم‌گر فرهنگ و رسانه که محتوا را مطابق ارزش‌های اسلامی مدیریت می‌کند، مجوز نشر کتاب، فیلم، موسیقی و هنر را صادر و نظام سانسور و کنترل واردات و صادرات آثار فرهنگی و فضای مجازی را اداره می‌کند.',
    descriptionEn:
      'Regulates cultural and media content to align with Islamic values, licences publications, films, music and art, administers censorship including internet filtering, and controls import and export of cultural goods.',
  },
  {
    key: 'ministry_health',
    parentKey: 'executive_branch',
    name: 'وزارت بهداشت، درمان و آموزش پزشکی',
    nameEn: 'Ministry of Health and Medical Education',
    description:
      'مسئول تدوین سیاست‌های بهداشت عمومی، مدیریت شبکه‌های درمانی، نظارت و اعتباربخشی به آموزش پزشکی، پرستاری و علوم پیراپزشکی و ارتقای تحقیقات و توسعه منابع انسانی سلامت.',
    descriptionEn:
      'Sets public health policy, manages healthcare delivery networks, accredits and supervises medical, nursing and allied health education institutions, and promotes research and professional development across the health sector.',
  },
  {
    key: 'ministry_ict',
    parentKey: 'executive_branch',
    name: 'وزارت ارتباطات و فناوری اطلاعات',
    nameEn: 'Ministry of Information and Communications Technology',
    description:
      'مسئول خدمات پستی و مخابراتی و فناوری اطلاعات، تنظیم ارتباطات اینترنتی و زیرساخت‌های دیجیتال ملی و صدور مجوزهای واردات تجهیزات ارتباطی.',
    descriptionEn:
      'Responsible for postal services, telecommunications and information technology; regulates internet and digital communications, develops national ICT infrastructure, and issues import licences for communications equipment.',
  },
  {
    key: 'legislative_branch',
    parentKey: 'iri_government',
    name: 'قوه مقننه',
    nameEn: 'Legislative Branch',
    description:
      'ساختار قانون‌گذاری شامل مجلس شورای اسلامی و شوراهای نظارتی وابسته.',
    descriptionEn:
      'Legislative structure anchored by the Islamic Consultative Assembly and its oversight councils.',
  },
  {
    key: 'majlis',
    parentKey: 'legislative_branch',
    name: 'مجلس شورای اسلامی',
    nameEn: 'Islamic Consultative Assembly (Majlis)',
    description:
      'پارلمان تک‌مجلسی با نمایندگان منتخب که قوانین، بودجه و طرح‌های ملی را تصویب می‌کند.',
    descriptionEn:
      'Unicameral parliament whose elected members pass laws, budgets, and national development bills.',
  },
  {
    key: 'majlis_presidium',
    parentKey: 'majlis',
    name: 'هیئت رئیسه مجلس',
    nameEn: 'Parliament Presidium',
    description:
      'هیئت مدیریتی برای اداره جلسات، تعیین دستور کار و نظارت اداری بر کمیسیون‌ها.',
    descriptionEn:
      'Leadership board that schedules floor business and administers parliamentary commissions.',
  },
  {
    key: 'article90_commission',
    parentKey: 'majlis',
    name: 'کمیسیون اصل نود قانون اساسی',
    nameEn: 'Article 90 Oversight Commission',
    description:
      'کمیسیون رسیدگی به شکایات مردم و نظارت بر عملکرد سه قوه طبق اصل ۹۰ قانون اساسی.',
    descriptionEn:
      'Commission handling citizen complaints and monitoring all three branches under Article 90.',
  },
  {
    key: 'parliament_research_center',
    parentKey: 'majlis',
    name: 'مرکز پژوهش‌های مجلس',
    nameEn: 'Parliament Research Center',
    description:
      'نهاد کارشناسی برای تهیه گزارش‌های تحلیلی، پیشنهادهای اصلاح قانون و ارزیابی تأثیر مقررات.',
    descriptionEn:
      'Analytical office producing research, legislative impact assessments, and policy briefs for MPs.',
  },
  {
    key: 'judiciary_branch',
    parentKey: 'iri_government',
    name: 'قوه قضاییه',
    nameEn: 'Judiciary Branch',
    description:
      'سیستم قضایی شامل دادگاه‌ها، دادستانی و نهادهای نظارتی که ریاست آن از سوی رهبری منصوب می‌شود.',
    descriptionEn:
      'Judicial system encompassing courts, prosecution offices, and oversight bodies led by a chief appointed by the Supreme Leader.',
  },
  {
    key: 'supreme_court',
    parentKey: 'judiciary_branch',
    name: 'دیوان عالی کشور',
    nameEn: 'Supreme Court of Iran',
    description:
      'بالاترین مرجع قضایی برای نظارت بر اجرای صحیح قوانین در دادگاه‌ها، ایجاد وحدت رویه قضایی و رسیدگی به فرجام‌خواهی‌ها.',
    descriptionEn:
      'Highest judicial authority that supervises proper application of laws by the courts, ensures uniformity of legal procedure, reviews appeals, and issues binding precedents.',
  },
  {
    key: 'attorney_general_office',
    parentKey: 'judiciary_branch',
    name: 'دادستانی کل کشور',
    nameEn: 'Office of the Attorney General',
    description:
      'مرجع تعقیب عمومی، نظارت بر دادسراها و طرح دعاوی علیه مقام‌ها و نهادها.',
    descriptionEn:
      'Prosecution authority overseeing all public prosecutors and filing national-level charges.',
  },
  {
    key: 'general_inspection',
    parentKey: 'judiciary_branch',
    name: 'سازمان بازرسی کل کشور',
    nameEn: 'General Inspection Organization',
    description:
      'سازمان بازرسی وابسته به قوه قضائیه که بر حسن اجرای قوانین توسط دستگاه‌های اجرایی نظارت می‌کند و با فساد و تخلفات اداری مبارزه می‌کند.',
    descriptionEn:
      'Inspectorate under the judiciary that monitors the proper implementation of laws by administrative organs and investigates corruption, misconduct and deviations from the law within government bodies.',
  },
  {
    key: 'prisons_organization',
    parentKey: 'judiciary_branch',
    name: 'سازمان زندان‌ها و اقدامات تأمینی',
    nameEn: 'Prisons and Security-Corrective Organization',
    description:
      'پایش و اداره زندان‌ها، بازداشتگاه‌ها و برنامه‌های بازپروری و مراقبت‌های پس از آزادی.',
    descriptionEn:
      'Manages prisons, detention centers, rehabilitation, and post-release supervision programs.',
  },
  {
    key: 'revolutionary_courts',
    parentKey: 'judiciary_branch',
    name: 'دادگاه‌های انقلاب اسلامی',
    nameEn: 'Islamic Revolutionary Courts',
    description:
      'شبکه‌ای از دادگاه‌های ویژه برای رسیدگی به جرائم امنیتی، سیاسی و اقتصادی حساس.',
    descriptionEn:
      'Specialized court system addressing security, political, and major economic offenses.',
  },
  {
    key: 'armed_forces_general_staff',
    parentKey: 'supreme_leader_office',
    name: 'ستاد کل نیروهای مسلح',
    nameEn: 'General Staff of the Armed Forces',
    description:
      'بالاترین ستاد نظامی که وظیفه تدوین سیاست‌ها و هماهنگی عملیات نیروهای زمینی، دریایی، هوایی، سپاه و پلیس را بر عهده دارد؛ در سال ۱۳۶۸ تشکیل شده و مستقیماً تابع رهبر است.',
    descriptionEn:
      'Most senior military command body charged with formulating policy and coordinating operations across the Army (Artesh), IRGC and national police; established in 1989 and directly answerable to the Supreme Leader.',
  },
  {
    key: 'army_headquarters',
    parentKey: 'armed_forces_general_staff',
    name: 'ارتش جمهوری اسلامی ایران',
    nameEn: 'Islamic Republic of Iran Army',
    description:
      'ارتش متعارف جمهوری اسلامی که مسئول حفظ تمامیت ارضی و دفاع از کشور بوده و از نیروهای زمینی، هوایی، دریایی و پدافند هوایی تشکیل می‌شود.',
    descriptionEn:
      'Conventional armed forces tasked with defending Iran’s territorial integrity and projecting national power, comprising ground, air, naval and air‑defense branches.',
  },
  {
    key: 'irgc',
    parentKey: 'armed_forces_general_staff',
    name: 'سپاه پاسداران انقلاب اسلامی',
    nameEn: 'Islamic Revolutionary Guard Corps (IRGC)',
    description:
      'نیروی ایدئولوژیک و چند شاخه ایجاد شده پس از انقلاب ۱۳۵۷ که برای حفظ نظام اسلامی و مقابله با تهدیدات داخلی و خارجی تحت فرماندهی مستقیم رهبر عمل می‌کند و دارای بخش‌های زمینی، هوافضا، دریایی و اقتصادی است و نقش مهمی در امنیت داخلی، اقتصاد و نفوذ منطقه‌ای دارد.',
    descriptionEn:
      'Paramilitary and ideological force created after the 1979 revolution to protect the Islamic system; reports directly to the Supreme Leader and operates ground, aerospace, naval and economic branches, playing a key role in internal security, regional power projection and the economy.',
  },
  {
    key: 'irgc_qods_force',
    parentKey: 'irgc',
    name: 'نیروی قدس سپاه پاسداران',
    nameEn: 'IRGC Qods Force',
    description:
      'واحد عملیات ویژه سپاه برای انجام عملیات برون‌مرزی، آموزش و تجهیز گروه‌های مسلح متحد و هدایت نیروهای نیابتی در خارج از کشور.',
    descriptionEn:
      'Special operations branch of the IRGC responsible for extraterritorial operations, including training, equipping and supporting allied militant groups and proxy forces abroad.',
  },
  {
    key: 'irgc_intelligence',
    parentKey: 'irgc',
    name: 'سازمان اطلاعات سپاه',
    nameEn: 'IRGC Intelligence Organization',
    description:
      'سازمان اطلاعاتی سپاه که به پایش تهدیدهای امنیتی، ضدجاسوسی و بازداشت مخالفان می‌پردازد و در برخی حوزه‌ها با وزارت اطلاعات رقابت می‌کند.',
    descriptionEn:
      'Internal intelligence and security organisation of the IRGC that conducts surveillance of dissidents, counterintelligence, and arrests, often overlapping and competing with the Ministry of Intelligence.',
  },
  {
    key: 'basij_force',
    parentKey: 'irgc',
    name: 'سازمان بسیج مستضعفین',
    nameEn: 'Basij Resistance Force',
    description:
      'نیروی شبه‌نظامی داوطلب تحت نظر سپاه که شهروندان را برای امنیت داخلی، اجرای قوانین اخلاقی، سرکوب اعتراض‌ها و انجام برنامه‌های خدماتی و فرهنگی بسیج می‌کند.',
    descriptionEn:
      'Volunteer paramilitary militia under the IRGC that mobilizes civilians for internal security, enforcement of moral codes, suppression of protests, and provision of social services and ideological programmes.',
  },
  {
    key: 'law_enforcement_command',
    parentKey: 'armed_forces_general_staff',
    name: 'فرماندهی انتظامی جمهوری اسلامی ایران',
    nameEn: 'Law Enforcement Command (FARAJA)',
    description:
      'فرماندهی پلیس سراسری که مسئول امنیت عمومی، کنترل ترافیک، تحقیقات جنایی، مقابله با مواد مخدر، حفاظت از مرزها و مقابله با شورش‌ها و برقراری نظم در سراسر کشور است.',
    descriptionEn:
      'Uniformed national police force responsible for public security, traffic control, criminal investigation, anti‑narcotics, border security, riot control and related policing duties across Iran.',
  },
  {
    key: 'defense_industries_org',
    parentKey: 'armed_forces_general_staff',
    name: 'سازمان صنایع دفاع',
    nameEn: 'Defense Industries Organization',
    description:
      'مجموعه صنایع دفاع دولتی که زیر نظر نیروهای مسلح طیف گسترده‌ای از تجهیزات نظامی اعم از سلاح‌های سبک و سنگین، مهمات، توپخانه، موشک و پهپاد را طراحی و تولید می‌کند.',
    descriptionEn:
      'State‑owned defence conglomerate under the armed forces that develops and manufactures a broad range of military equipment – from small arms and artillery to ammunition, missiles and drones – through specialised subsidiaries.',
  },
];
