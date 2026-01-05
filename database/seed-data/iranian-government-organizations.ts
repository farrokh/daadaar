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
      'نهاد مسئول تدوین برنامه‌های توسعه، بودجه کل کشور و پایش اجرای پروژه‌های اولویت‌دار.',
    descriptionEn:
      'Agency responsible for national development planning, annual budgets, and monitoring flagship projects.',
  },
  {
    key: 'administrative_org',
    parentKey: 'executive_branch',
    name: 'سازمان اداری و استخدامی کشور',
    nameEn: 'Administrative and Recruitment Organization',
    description:
      'متولی سیاست‌های منابع انسانی دولت، طبقه‌بندی مشاغل و نظام ارزیابی عملکرد کارمندان.',
    descriptionEn:
      'Leads civil-service workforce policies, job classifications, and performance evaluation frameworks.',
  },
  {
    key: 'ministry_interior',
    parentKey: 'executive_branch',
    name: 'وزارت کشور',
    nameEn: 'Ministry of Interior',
    description:
      'مسئول امور استانداری‌ها، امنیت داخلی، انتخابات و مدیریت بحران در سطح ملی.',
    descriptionEn:
      'Oversees provincial governance, domestic security coordination, elections, and national crisis management.',
  },
  {
    key: 'ministry_intelligence',
    parentKey: 'executive_branch',
    name: 'وزارت اطلاعات',
    nameEn: 'Ministry of Intelligence',
    description:
      'نهاد اصلی جمع‌آوری اطلاعات، ضدجاسوسی و عملیات امنیتی در حوزه‌های داخلی و خارجی.',
    descriptionEn:
      'Primary civilian intelligence service handling collection, counterintelligence, and security operations domestically and abroad.',
  },
  {
    key: 'ministry_foreign_affairs',
    parentKey: 'executive_branch',
    name: 'وزارت امور خارجه',
    nameEn: 'Ministry of Foreign Affairs',
    description:
      'مسئول دیپلماسی، مذاکرات بین‌المللی، و مدیریت سفارتخانه‌ها و نمایندگی‌های خارج از کشور.',
    descriptionEn:
      'Leads diplomacy, treaty negotiations, and management of embassies and missions abroad.',
  },
  {
    key: 'ministry_defense',
    parentKey: 'executive_branch',
    name: 'وزارت دفاع و پشتیبانی نیروهای مسلح',
    nameEn: 'Ministry of Defense and Armed Forces Logistics',
    description:
      'تأمین‌کننده پشتیبانی صنعتی و لجستیکی نیروهای مسلح و اداره صنایع دفاعی تحت نظر دولت.',
    descriptionEn:
      'Provides industrial and logistical support to the armed forces and manages state defense industries.',
  },
  {
    key: 'ministry_oil',
    parentKey: 'executive_branch',
    name: 'وزارت نفت',
    nameEn: 'Ministry of Petroleum',
    description:
      'مدیریت بخش‌های نفت، گاز و پتروشیمی و سیاستگذاری صادرات انرژی.',
    descriptionEn:
      'Oversees oil, gas, and petrochemical sectors and sets national energy export policy.',
  },
  {
    key: 'ministry_industry',
    parentKey: 'executive_branch',
    name: 'وزارت صنعت، معدن و تجارت',
    nameEn: 'Ministry of Industry, Mine and Trade',
    description:
      'نقش‌آفرین در توسعه صنعتی، مدیریت معادن و تنظیم تجارت داخلی و خارجی.',
    descriptionEn:
      'Coordinates industrial development, mining oversight, and domestic and international trade regulation.',
  },
  {
    key: 'ministry_culture',
    parentKey: 'executive_branch',
    name: 'وزارت فرهنگ و ارشاد اسلامی',
    nameEn: 'Ministry of Culture and Islamic Guidance',
    description:
      'متولی سیاست‌های فرهنگی، رسانه‌ای و صدور مجوز برای فعالیت‌های هنری و مطبوعاتی.',
    descriptionEn:
      'Sets cultural and media policy and issues permits for artistic and press activities.',
  },
  {
    key: 'ministry_health',
    parentKey: 'executive_branch',
    name: 'وزارت بهداشت، درمان و آموزش پزشکی',
    nameEn: 'Ministry of Health and Medical Education',
    description:
      'مسئول سیاستگذاری بهداشت عمومی، شبکه درمانی و آموزش علوم پزشکی در سراسر کشور.',
    descriptionEn:
      'Oversees public health policy, national care delivery networks, and medical education.',
  },
  {
    key: 'ministry_ict',
    parentKey: 'executive_branch',
    name: 'وزارت ارتباطات و فناوری اطلاعات',
    nameEn: 'Ministry of Information and Communications Technology',
    description:
      'نهاد تنظیم‌گر حوزه ارتباطات، اینترنت، پست و زیرساخت‌های دیجیتال ملی.',
    descriptionEn:
      'Regulates telecom, internet, postal services, and national digital infrastructure.',
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
      'بالاترین مرجع نظارت بر احکام، ایجاد وحدت رویه و رسیدگی به اعتراضات از سراسر کشور.',
    descriptionEn:
      'Highest tribunal for reviewing verdicts, issuing binding precedents, and hearing appeals nationwide.',
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
      'نهاد بازرسی مستقل برای کشف تخلفات اداری، فساد و انحراف از قوانین در دستگاه‌های حکومتی.',
    descriptionEn:
      'Independent inspectorate detecting administrative violations, corruption, and legal deviations in state bodies.',
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
      'عالی‌ترین مرجع فرماندهی نیروهای زمینی، هوایی، دریایی، سپاه و انتظامی تحت نظر رهبری.',
    descriptionEn:
      'Top command authority for the army, IRGC, and law-enforcement forces under the Supreme Leader.',
  },
  {
    key: 'army_headquarters',
    parentKey: 'armed_forces_general_staff',
    name: 'ارتش جمهوری اسلامی ایران',
    nameEn: 'Islamic Republic of Iran Army',
    description:
      'نیروی مسلح کلاسیک شامل نیروهای زمینی، هوایی، دریایی و قرارگاه پدافند هوایی خاتم‌الانبیاء.',
    descriptionEn:
      'Conventional military force composed of ground, air, navy, and Khatam al-Anbiya air defense commands.',
  },
  {
    key: 'irgc',
    parentKey: 'armed_forces_general_staff',
    name: 'سپاه پاسداران انقلاب اسلامی',
    nameEn: 'Islamic Revolutionary Guard Corps (IRGC)',
    description:
      'نیروی ایدئولوژیک و چندشاخه با مأموریت دفاع از نظام، شامل بخش‌های زمینی، هوافضا، دریایی و اقتصادی.',
    descriptionEn:
      'Ideological force with ground, aerospace, naval, and economic arms tasked with safeguarding the revolution.',
  },
  {
    key: 'irgc_qods_force',
    parentKey: 'irgc',
    name: 'نیروی قدس سپاه پاسداران',
    nameEn: 'IRGC Qods Force',
    description:
      'بخش برون‌مرزی سپاه مسئول عملیات برون‌سرزمینی و ارتباط با گروه‌های نیابتی.',
    descriptionEn:
      'External operations arm managing overseas campaigns and relationships with allied non-state actors.',
  },
  {
    key: 'irgc_intelligence',
    parentKey: 'irgc',
    name: 'سازمان اطلاعات سپاه',
    nameEn: 'IRGC Intelligence Organization',
    description:
      'تشکیلات اطلاعاتی سپاه برای پایش تهدیدهای امنیتی، عملیات ضدجاسوسی و بازداشت فعالان مخالف.',
    descriptionEn:
      'IRGC intelligence apparatus monitoring security threats, running counterintelligence, and conducting arrests.',
  },
  {
    key: 'basij_force',
    parentKey: 'irgc',
    name: 'سازمان بسیج مستضعفین',
    nameEn: 'Basij Resistance Force',
    description:
      'شبکه شبه‌نظامی و اجتماعی سپاه برای بسیج نیروهای مردمی، کنترل تجمعات و عملیات فرهنگی.',
    descriptionEn:
      'Paramilitary and social mobilization wing organizing volunteers for security, cultural, and suppression missions.',
  },
  {
    key: 'law_enforcement_command',
    parentKey: 'armed_forces_general_staff',
    name: 'فرماندهی انتظامی جمهوری اسلامی ایران',
    nameEn: 'Law Enforcement Command (FARAJA)',
    description:
      'نیروی پلیس سراسری برای امنیت شهری، مرزی و کنترل اجتماعی با واحدهایی مانند پلیس امنیت و پلیس راهور.',
    descriptionEn:
      'Nationwide police force responsible for urban security, borders, and social control units such as security and traffic police.',
  },
  {
    key: 'defense_industries_org',
    parentKey: 'armed_forces_general_staff',
    name: 'سازمان صنایع دفاع',
    nameEn: 'Defense Industries Organization',
    description:
      'کنسرسیوم صنعتی زیر نظر نیروهای مسلح برای طراحی و تولید تجهیزات نظامی، موشکی و پهپادی.',
    descriptionEn:
      'Industrial consortium under the armed forces that designs and produces military, missile, and UAV systems.',
  },
];
