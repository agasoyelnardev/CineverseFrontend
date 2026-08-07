import { Movie, Collection, Discussion, Notification, Activity, User, Book, BookReview, BookCollection, BookVsMovie } from './types';

export const MOCK_MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Ulduzlararası',
    originalTitle: 'Interstellar',
    description: 'Bəşəriyyətin gələcəyi təhlükədədir. Bir qrup tədqiqatçı insan irqinin sağ qalmasını təmin etmək üçün qalaktikalararası səyahətə çıxır, soxulcan dəliyindən keçərək yeni yaşayış yararlı planet axtarır. Zaman, cazibə qüvvəsi və sevginin sərhədlərini aşan möhtəşəm elmi-fantastik şahəsər.',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    rating: 8.7,
    year: 2014,
    duration: '2saat 49dəq',
    genres: ['Elmi-Fantastika', 'Dram', 'Macəra'],
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    likes: 1240,
    reviews: [
      {
        id: 'r1',
        movieId: 'm1',
        movieTitle: 'Ulduzlararası',
        userId: 'u2',
        username: 'Elmir_Aliyev',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        rating: 10,
        comment: 'Kinonun zirvəsidir. Hans Zimmer-in musiqiləri insanı tamamilə başqa bir dünyaya aparır. Ağlamamaq əldə deyil.',
        likes: 42,
        date: '2026-07-01'
      },
      {
        id: 'r2',
        movieId: 'm1',
        movieTitle: 'Ulduzlararası',
        userId: 'u3',
        username: 'Leyla_K',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        rating: 9,
        comment: 'Elmi tərəfi ilə bədii tərəfinin sintezi çox mükəmməldir. Nolan həqiqətən dahi rejissordur.',
        likes: 18,
        date: '2026-07-03'
      }
    ]
  },
  {
    id: 'm2',
    title: 'Başlanğıc',
    originalTitle: 'Inception',
    description: 'Dom Kobb insanların yuxuda olarkən şüuraltının dərinliklərindən qiymətli sirləri oğurlamaq bacarığına malik olan peşəkar oğrudur. Ona bu dəfə qeyri-adi tapşırıq verilir: sirr oğurlamaq deyil, şüuraltına yeni fikir yerləşdirmək (Başlanğıc). Əgər o buna nail olsa, həyatını geri qazanacaq.',
    poster: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    rating: 8.8,
    year: 2010,
    duration: '2saat 28dəq',
    genres: ['Elmi-Fantastika', 'Triller', 'Aksiyon'],
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    trailerUrl: 'https://www.youtube.com/embed/YoHD9XEInc0',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    likes: 1512,
    reviews: [
      {
        id: 'r3',
        movieId: 'm2',
        movieTitle: 'Başlanğıc',
        userId: 'u4',
        username: 'Anar_G',
        userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80',
        rating: 9,
        comment: 'Hər izlədiyimdə fərqli detallar tapıram. Ssenari o qədər mürəkkəb və gözəldir ki, heyran qalmamaq olmur.',
        likes: 29,
        date: '2026-06-28'
      }
    ]
  },
  {
    id: 'm3',
    title: 'Dyun: İkinci Hissə',
    originalTitle: 'Dune: Part Two',
    description: 'Pol Atreydes Fremen xalqı və Çani ilə birləşərək, ailəsini məhv edən sui-qəsdçilərdən qan intiqamı almaq üçün yola çıxır. O, kainatın taleyi ilə sevdiyi insanın taleyi arasında seçim etmək məcburiyyətində qalır və yalnız özünün qabaqcadan görə bildiyi dəhşətli gələcəyin qarşısını almağa çalışır.',
    poster: 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=1200&auto=format&fit=crop&q=80',
    rating: 8.6,
    year: 2024,
    duration: '2saat 46dəq',
    genres: ['Elmi-Fantastika', 'Dram', 'Macəra'],
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
    trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    likes: 980,
    reviews: [
      {
        id: 'r4',
        movieId: 'm3',
        movieTitle: 'Dyun: İkinci Hissə',
        userId: 'u2',
        username: 'Elmir_Aliyev',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        rating: 10,
        comment: 'Denis Villeneuve kino sənətinə yeni bir vizuallıq gətirdi. Səslər və görüntülər inanılmaz dərəcədə möhtəşəmdir.',
        likes: 56,
        date: '2026-07-05'
      }
    ]
  },
  {
    id: 'm4',
    title: 'Qara Cəngavər',
    originalTitle: 'The Dark Knight',
    description: 'Betmen, leytenant Cim Qordon və prokuror Harvi Dent Qotem şəhərini cinayətkarlıqdan təmizləmək üçün güclərini birləşdirirlər. Lakin şəhərdə xaos yaradan və Betmeni anarxiya ilə üz-üzə qoyan Joker adlı yeni, dahi cinayətkar peydə olur.',
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1200&auto=format&fit=crop&q=80',
    rating: 9.0,
    year: 2008,
    duration: '2saat 32dəq',
    genres: ['Aksiyon', 'Triller', 'Dram'],
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Maggie Gyllenhaal'],
    trailerUrl: 'https://www.youtube.com/embed/EXeTwQWrcwY',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    likes: 1890,
    reviews: [
      {
        id: 'r5',
        movieId: 'm4',
        movieTitle: 'Qara Cəngavər',
        userId: 'u5',
        username: 'Aysel_M',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        rating: 10,
        comment: 'Heath Ledger-in canlandırdığı Joker obrazı kino tarixinin ən yaxşı aktyorluq performanslarından biridir.',
        likes: 74,
        date: '2026-07-04'
      }
    ]
  },
  {
    id: 'm5',
    title: 'Parazit',
    originalTitle: 'Gisaengchung',
    description: 'Bütün üzvləri işsiz olan yoxsul Kim ailəsi çox zəngin Park ailəsinin həyatına hiylə ilə daxil olur. Bir-bir ailənin sürücüsü, ev köməkçisi və müəllimi olan Kim ailəsinin bu lüks həyat macərası gözlənilməz və qaranlıq bir faciəyə doğru sürüklənir.',
    poster: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80',
    rating: 8.5,
    year: 2019,
    duration: '2saat 12dəq',
    genres: ['Dram', 'Triller', 'Komediya'],
    director: 'Bong Joon Ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik'],
    trailerUrl: 'https://www.youtube.com/embed/5xH0HfJHsaY',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    likes: 820,
    reviews: []
  },
  {
    id: 'm6',
    title: 'Ruhların Səyahəti',
    originalTitle: 'Sen to Chihiro no Kamikakushi',
    description: '10 yaşlı Çihiro ailəsi ilə birlikdə yeni evlərinə köçərkən yolda qəribə bir qəsəbəyə rast gəlirlər. Ailəsi qorxulu bir lənətlə donuza çevrildikdən sonra Çihiro ruhların, tanrıların və sehrli varlıqların yaşadığı qəribə bir hamam kompleksində işləməli və ailəsini xilas etməlidir.',
    poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
    rating: 8.6,
    year: 2001,
    duration: '2saat 5dəq',
    genres: ['Animasiya', 'Fentezi', 'Macəra'],
    director: 'Hayao Miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki', 'Takashi Naito'],
    trailerUrl: 'https://www.youtube.com/embed/ByXuk9QqQkk',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    likes: 910,
    reviews: []
  },
  {
    id: 'm7',
    title: 'Kriminal Qiraət',
    originalTitle: 'Pulp Fiction',
    description: 'İki professional killer, Vincent Vega və Jules Winnfield, boksçu Butch Coolidge, qanqster bossu Marsellus Wallace və onun cazibədar xanımı Mia Wallace-ın yollarının kəsişdiyi, qara yumor və şiddətlə dolu, fərqli xronoloji ardıcıllıqla nəql olunan Tarantino şahəsəri.',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80',
    rating: 8.9,
    year: 1994,
    duration: '2saat 34dəq',
    genres: ['Kriminal', 'Dram'],
    director: 'Quentin Tarantino',
    cast: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman', 'Bruce Willis'],
    trailerUrl: 'https://www.youtube.com/embed/s7EdQ4FqbhY',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    likes: 1350,
    reviews: []
  },
  {
    id: 'm8',
    title: 'Matris',
    originalTitle: 'The Matrix',
    description: 'Gənc kompüter proqramçısı və haker Thomas Anderson (Neo) qorxulu bir həqiqəti öyrənir: bütün bəşəriyyətin yaşadığı dünya əslində maşınlar tərəfindən idarə olunan süni bir simulyasiyadır (Matris). O, Morfeus və Triniti ilə birləşərək bu qəfəsdən xilas olmaq üçün üsyana qoşulur.',
    poster: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&auto=format&fit=crop&q=80',
    rating: 8.7,
    year: 1999,
    duration: '2saat 16dəq',
    genres: ['Elmi-Fantastika', 'Aksiyon'],
    director: 'Lana Wachowski',
    cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss', 'Hugo Weaving'],
    trailerUrl: 'https://www.youtube.com/embed/vKQi3bBA1y8',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    likes: 1120,
    reviews: []
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'elnar_agasoy',
    name: 'Elnar Ağasoy',
    email: 'user@cineverse.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Kino tənqidçisi, böyük Nolan fanatı. Hər həftə yeni bir şahəsər kəşf edirəm.',
    followersCount: 142,
    followingCount: 95,
    role: 'user',
    favorites: ['m1', 'm3', 'm4'],
    watchlist: ['m5', 'm6'],
    savedCollections: ['c1'],
    followers: ['u2', 'u3', 'u4'],
    following: ['u2', 'u5'],
    points: 240
  },
  {
    id: 'u_admin',
    username: 'admin_cineverse',
    name: 'CineVerse Admin',
    email: 'admin@cineverse.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    bio: 'CineVerse platformasının baş administratoru və təsisçisi.',
    followersCount: 1200,
    followingCount: 12,
    role: 'admin',
    favorites: ['m1', 'm2', 'm4', 'm8'],
    watchlist: ['m3', 'm7'],
    savedCollections: [],
    followers: ['u1', 'u2', 'u3', 'u4', 'u5'],
    following: ['u1', 'u2'],
    points: 850
  },
  {
    id: 'u2',
    username: 'Elmir_Aliyev',
    name: 'Elmir Əliyev',
    email: 'elmir@cineverse.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Rejissorluq tələbəsi. Əsasən arthouse və klassik filmləri sevirəm.',
    followersCount: 89,
    followingCount: 120,
    role: 'user',
    favorites: ['m1', 'm3', 'm6'],
    watchlist: ['m4', 'm7'],
    savedCollections: [],
    followers: ['u1', 'u5'],
    following: ['u1', 'u3', 'u4'],
    points: 90
  },
  {
    id: 'u3',
    username: 'Leyla_K',
    name: 'Leyla Kərimova',
    email: 'leyla@cineverse.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Animasiya həvəskarı, Studio Ghibli aşiqlərindən biri.',
    followersCount: 204,
    followingCount: 150,
    role: 'user',
    favorites: ['m6', 'm1'],
    watchlist: ['m2', 'm8'],
    savedCollections: [],
    followers: ['u2', 'u4'],
    following: ['u1', 'u2'],
    points: 310
  },
  {
    id: 'u4',
    username: 'Anar_G',
    name: 'Anar Qasımov',
    email: 'anar@cineverse.com',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80',
    bio: 'Kompüter elmləri tələbəsi. Elmi-fantastika və kiberpank mövzulu filmlərə heyranam.',
    followersCount: 63,
    followingCount: 40,
    role: 'user',
    favorites: ['m2', 'm8'],
    watchlist: ['m1', 'm3'],
    savedCollections: [],
    followers: ['u2'],
    following: ['u1', 'u3']
  },
  {
    id: 'u5',
    username: 'Aysel_M',
    name: 'Aysel Məmmədova',
    email: 'aysel@cineverse.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Triller və qorxu filmlərinin heyranı. Həyəcan dolu ssenarilər axtarışındayam.',
    followersCount: 110,
    followingCount: 88,
    role: 'user',
    favorites: ['m4', 'm5', 'm2'],
    watchlist: ['m6'],
    savedCollections: [],
    followers: ['u1', 'u2'],
    following: ['u1', 'u4']
  }
];

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'c1',
    title: 'Ən Yaxşı Elmi-Fantastika Filmləri',
    description: 'Zamanı və məkanı unudacağınız, elmi cəhətdən əsaslandırılmış və vizual şahəsərlərdən ibarət kolleksiya.',
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    userId: 'u_admin',
    username: 'admin_cineverse',
    likesCount: 145,
    movies: ['m1', 'm2', 'm3', 'm8']
  },
  {
    id: 'c2',
    title: 'Nolanın Dərin Dünyası',
    description: 'Zaman anlayışı ilə oynayan, ssenariləri ilə beyin yandıran dahi rejissor Christopher Nolanın ən yaxşı filmləri.',
    cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    userId: 'u1',
    username: 'elnar_agasoy',
    likesCount: 98,
    movies: ['m1', 'm2', 'm4']
  },
  {
    id: 'c3',
    title: 'İntellektual Triller Gecəsi',
    description: 'İzləyərkən hər anı diqqətlə təqib etməli olduğunuz, sonluğu ilə təəccübləndirən filmlər.',
    cover: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80',
    userId: 'u5',
    username: 'Aysel_M',
    likesCount: 54,
    movies: ['m2', 'm4', 'm5']
  }
];

export const MOCK_DISCUSSIONS: Discussion[] = [
  {
    id: 'd1',
    title: 'Ulduzlararası filminin sonluğu haqqında nəzəriyyəniz nədir?',
    content: 'Kupun 5-ölçülü fəzada (Tesserakt) keçirdiyi zaman və qızına göndərdiyi qravitasiya siqnalları haqqında nə düşünürsünüz? Sizcə bu gələcəkdəki insanların köməyi idi, yoxsa sadəcə zaman paradoksu?',
    category: 'Nəzəriyyələr',
    author: 'elnar_agasoy',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    likes: 24,
    comments: [
      {
        id: 'dc1',
        author: 'Anar_G',
        authorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80',
        content: 'Bəli, məncə bu gələcək nəsillərin yaratdığı bir zaman dövrəsidir (bootstrap paradox). İnsanlıq özünü xilas etmək üçün bu tesseraktı inşa edib.',
        date: '2026-07-06 14:30'
      },
      {
        id: 'dc2',
        author: 'Leyla_K',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        content: 'Məncə filmin əsas fəlsəfəsi elmi fərziyyələrdən çox sevginin fiziki sərhədləri aşan bir güc olduğunu göstərmək idi.',
        date: '2026-07-06 15:12'
      }
    ],
    date: '2026-07-06 12:00'
  },
  {
    id: 'd2',
    title: 'Yeni başlayanlar üçün Studio Ghibli tövsiyələri',
    content: 'Studio Ghibli dünyasına daxil olmaq istəyirəm. Ruhların Səyahətindən başqa hansı cizgi filmlərini tövsiyə edirsiniz? İlk olaraq hansından başlamalıyam?',
    category: 'Tövsiyələr',
    author: 'Anar_G',
    authorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80',
    likes: 12,
    comments: [
      {
        id: 'dc3',
        author: 'Leyla_K',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        content: '"Qonşum Totoro" və "Haulun Səyyar Qəsri" mütləq izlənməlidir! Onların hər ikisi Miyazaki sehrini tam əks etdirir.',
        date: '2026-07-05 10:20'
      }
    ],
    date: '2026-07-04 18:30'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'party_invite',
    title: 'İzləmə Partiyası Dəvəti',
    description: 'admin_cineverse sizi "Dyun: İkinci Hissə" filminin izləmə partiyasına dəvət edir.',
    date: 'İndi',
    read: false
  },
  {
    id: 'n2',
    type: 'follower',
    title: 'Yeni İzləyici',
    description: 'Leyla_K sizi izləməyə başladı.',
    date: '2 saat əvvəl',
    read: false
  },
  {
    id: 'n3',
    type: 'like',
    title: 'Bəyənmə',
    description: 'Elmir_Aliyev sizin "Ulduzlararası" filminə yazdığınız rəyi bəyəndi.',
    date: 'Dünən',
    read: true
  }
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    type: 'review',
    userId: 'u2',
    username: 'Elmir_Aliyev',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    text: 'Ulduzlararası filminə rəy yazdı: "Kinonun zirvəsidir. Hans Zimmer-in musiqiləri insanı..."',
    movieTitle: 'Ulduzlararası',
    movieId: 'm1',
    date: '2 saat əvvəl'
  },
  {
    id: 'a2',
    type: 'favorite',
    userId: 'u3',
    username: 'Leyla_K',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    text: 'Ruhların Səyahəti filmini Sevimlilərinə əlavə etdi.',
    movieTitle: 'Ruhların Səyahəti',
    movieId: 'm6',
    date: '5 saat əvvəl'
  },
  {
    id: 'a3',
    type: 'collection',
    userId: 'u1',
    username: 'elnar_agasoy',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    text: 'yeni kolleksiya yaratdı: "Nolanın Dərin Dünyası"',
    collectionName: 'Nolanın Dərin Dünyası',
    date: '1 gün əvvəl'
  },
  {
    id: 'a4',
    type: 'rate',
    userId: 'u4',
    username: 'Anar_G',
    userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80',
    text: 'Başlanğıc filminə 9 ulduz verdi.',
    movieTitle: 'Başlanğıc',
    movieId: 'm2',
    date: '2 gün əvvəl'
  }
];

export const MOCK_WATCH_PARTIES = [
  {
    id: 'wp1',
    roomName: 'Dyun 2 Gecəsi🍿',
    movieId: 'm3',
    creator: 'elnar_agasoy',
    participants: [
      { id: 'u1', name: 'Elnar Ağasoy', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
      { id: 'u2', name: 'Elmir Əliyev', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80' },
      { id: 'u3', name: 'Leyla Kərimova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' }
    ],
    currentTimestamp: 120,
    isPlaying: true,
    chat: [
      { id: 'c_m1', sender: 'Elmir Əliyev', senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', message: 'Hər kəsə salam! Səslər hamıda sinxrondur?', timestamp: '21:01' },
      { id: 'c_m2', sender: 'Leyla Kərimova', senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', message: 'Salam, bəli, əla işləyir. Çox maraqlı səhnədir!', timestamp: '21:02' },
      { id: 'c_m3', sender: 'Elnar Ağasoy', senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', message: 'Xoş gəldiniz! Səsi bir az artıraq, atmosfer mükəmməldir.', timestamp: '21:02' }
    ]
  },
  {
    id: 'wp2',
    roomName: 'Christopher Nolan Marafonu🧠',
    movieId: 'm1',
    creator: 'admin_cineverse',
    participants: [
      { id: 'u_admin', name: 'CineVerse Admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' },
      { id: 'u4', name: 'Anar Qasımov', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80' }
    ],
    currentTimestamp: 345,
    isPlaying: false,
    chat: [
      { id: 'c_m4', sender: 'CineVerse Admin', senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80', message: 'Bir azdan başlayırıq, digər dostları da gözləyək.', timestamp: '22:15' }
    ]
  }
];

export const MOCK_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Dyun',
    author: 'Frank Herbert',
    description: "Gələcəyin uzaq imperiyasında, kainatın ən qiymətli maddəsi olan 'ədviyyat' (melanj) yalnız səhra planeti Arrakisdə (Dyun) tapılır. Gənc Paul Atreides ailəsinin bu qorxulu planetdəki taleyini və bəşəriyyətin gələcəyini dəyişdirəcək mübarizəsini möhtəşəm şəkildə təsvir edən elmi-fantastik şahəsər. Frank Herbertin bu əsəri bütün zamanların ən çox satılan elmi-fantastika romanıdır.",
    cover: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=500&auto=format&fit=crop&q=80',
    rating: 4.8,
    language: 'az',
    genres: ['Elmi-Fantastika', 'Macəra', 'Siyasi'],
    year: 1965,
    pages: 612,
    likes: 345,
    movieAdaptationId: 'm3',
    isTrending: true,
    isTopRated: true,
    isNewRelease: false,
    reviews: [
      {
        id: 'br1',
        bookId: 'b1',
        bookTitle: 'Dyun',
        userId: 'u1',
        username: 'elnar_agasoy',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        comment: 'Kitab filmdən daha dərindir. Siyasi intriqalar və ekoloji mövzular mükəmməl işlənib.',
        likes: 12,
        date: '2026-07-04'
      }
    ]
  },
  {
    id: 'b2',
    title: 'Əli və Nino',
    author: 'Qurban Səid',
    description: 'Bakıda Birinci Dünya Müharibəsi və Azərbaycan Xalq Cümhuriyyəti qurulması ərəfəsində müsəlman azərbaycanlı gənc Əli xan Şirvanşir ilə xristian gürcü qızı Nino Kipiani arasındakı əbədi və faciəvi sevgidən bəhs edən, Azərbaycan ədəbiyyatının incilərindən sayılan klassik əsər. Şərq və Qərb mədəniyyətlərinin toqquşmasını və bütövləşməsini əks etdirir.',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80',
    rating: 4.9,
    language: 'az',
    genres: ['Dram', 'Romantika', 'Tarixi'],
    year: 1937,
    pages: 320,
    likes: 512,
    isTrending: true,
    isTopRated: true,
    isNewRelease: false,
    reviews: []
  },
  {
    id: 'b3',
    title: 'Təmiz Kod (Clean Code)',
    author: 'Robert C. Martin',
    description: 'Hətta pis kod da işləyə bilər. Lakin əgər kod təmiz deyilsə, o, inkişaf komandasını çökdürə bilər. Dahi proqramçı Robert Martin (Böyük Bob) bu kitabda peşəkar kod yazmağın qaydalarını və incəliklərini real nümunələrlə izah edir. Hər bir proqramçının stolüstü kitabı olmalıdır.',
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80',
    rating: 4.7,
    language: 'en',
    genres: ['Proqramlaşdırma', 'Texnologiya', 'Təhsil'],
    year: 2008,
    pages: 464,
    likes: 210,
    isTrending: true,
    isTopRated: true,
    isNewRelease: false,
    reviews: []
  },
  {
    id: 'b4',
    title: '1984',
    author: 'George Orwell',
    description: 'Böyük Qardaşın hər şeyi izlədiyi, düşüncə cinayətinin ölümlə cəzalandırıldığı totalitar dünyada fərdin azadlıq və sevgi uğrunda ümidsiz mübarizəsi. Dünya ədəbiyyatının ən güclü anti-utopik romanı, azad düşüncə və azadlığın manifestidir.',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80',
    rating: 4.9,
    language: 'az',
    genres: ['Dram', 'Siyasi', 'Anti-utopiya'],
    year: 1949,
    pages: 328,
    likes: 415,
    isTrending: true,
    isTopRated: true,
    isNewRelease: false,
    reviews: []
  },
  {
    id: 'b5',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    description: "Bilbo Begins adlı hobbitin sehirbaz Qendalf və 13 cırtdan ilə birlikdə Əjdaha Smaq tərəfindən qəsb edilmiş qədim xəzinəni geri qaytarmaq üçün çıxdığı təhlükəli və sehirli macəra. 'Üzüklərin Rəbbi' dastanının başlanğıcı sayılan dahi əsər.",
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    rating: 4.8,
    language: 'en',
    genres: ['Fentezi', 'Macəra', 'Klassik'],
    year: 1937,
    pages: 310,
    likes: 189,
    isTrending: false,
    isTopRated: true,
    isNewRelease: false,
    reviews: []
  },
  {
    id: 'b6',
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt & David Thomas',
    description: 'Yazılım mühəndisliyində karyerasını inkişaf etdirmək və daha səmərəli işləmək istəyənlər üçün əvəzolunmaz bələdçi. Kod keyfiyyəti, testlər, çevik metodologiya və komanda işi mövzularını əhatə edir. Həm yeni başlayanlar, həm də təcrübəli proqramçılar üçün uyğundur.',
    cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=80',
    rating: 4.8,
    language: 'en',
    genres: ['Proqramlaşdırma', 'Texnologiya'],
    year: 1999,
    pages: 352,
    likes: 130,
    isTrending: false,
    isTopRated: true,
    isNewRelease: false,
    reviews: []
  },
  {
    id: 'b7',
    title: 'Frankenşteyn',
    author: 'Mary Shelley',
    description: 'Gənc alim Viktor Frankenşteynin cansız bədənlərdən yaratdığı məxluqun və bu məxluqun öz yaradıcısına qarşı apardığı faciəvi və qorxulu intiqam mübarizəsi. Bu əsər elmi-fantastika janrının və qotik ədəbiyyatın təməllərindən biridir.',
    cover: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80',
    rating: 4.5,
    language: 'az',
    genres: ['Qorxu', 'Elmi-Fantastika', 'Klassik'],
    year: 1818,
    pages: 280,
    likes: 95,
    isTrending: false,
    isTopRated: false,
    isNewRelease: true,
    reviews: []
  },
  {
    id: 'b8',
    title: 'Gecəyarısı Kitabxanası (The Midnight Library)',
    author: 'Matt Haig',
    description: 'Həyatla ölüm arasında yerləşən bir kitabxanada insana yaşamadığı digər bütün alternativ həyatları sınamaq şansı verilir. Həyatın mənası, peşmanlıqlar və yaşamaq istəyi haqqında təsirli roman.',
    cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500&auto=format&fit=crop&q=80',
    rating: 4.6,
    language: 'en',
    genres: ['Dram', 'Fentezi', 'Fəlsəfə'],
    year: 2020,
    pages: 304,
    likes: 175,
    isTrending: false,
    isTopRated: false,
    isNewRelease: true,
    reviews: []
  },
  {
    id: 'b9',
    title: 'Xəz Paltarlı Madonna (Kürk Mantolu Madonna)',
    author: 'Sabahattin Ali',
    description: 'Raif Əfəndinin Berlin rəsm qalereyasında gördüyü bir portretlə başlayan və ömrünün sonunadək davam edən böyük, sakit və kədərli sevgisinin hekayəsi. İnsan ruhunun tənhalığını və anlaşılmazlığını möhtəşəm bir dillə təsvir edir.',
    cover: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500&auto=format&fit=crop&q=80',
    rating: 4.9,
    language: 'az',
    genres: ['Romantika', 'Dram'],
    year: 1943,
    pages: 160,
    likes: 420,
    isTrending: true,
    isTopRated: true,
    isNewRelease: false,
    reviews: []
  }
];

export const MOCK_BOOK_COLLECTIONS: BookCollection[] = [
  {
    id: 'bc1',
    title: 'Ən Yaxşı Proqramlaşdırma Kitabları',
    description: 'Yazılım mühəndisliyi və proqramlaşdırma sənətini dərindən öyrənmək istəyənlər üçün dahi yazarların seçilmiş əsərləri.',
    cover: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&auto=format&fit=crop&q=80',
    books: ['b3', 'b6']
  },
  {
    id: 'bc2',
    title: 'Ən Yaxşı Elmi-Fantastika Kitabları',
    description: 'Zaman, məkan, texnologiya və kainatın sərhədlərini aşan, təxəyyülü hərəkətə gətirən möhtəşəm hekayələr.',
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
    books: ['b1', 'b4', 'b7']
  },
  {
    id: 'bc3',
    title: 'Mütləq Oxunmalı Kitablar',
    description: 'İstər yerli ədəbiyyat, istərsə də dünya klassiklərindən hər bir insanın dünyagörüşünü dəyişəcək şahəsərlər.',
    cover: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500&auto=format&fit=crop&q=80',
    books: ['b1', 'b2', 'b4', 'b9']
  }
];

export const MOCK_BOOK_VS_MOVIES: BookVsMovie[] = [
  {
    id: 'bvm1',
    title: 'Dyun (Dune)',
    bookId: 'b1',
    movieId: 'm3',
    bookVotes: 142,
    movieVotes: 98,
    description: 'Frank Herbertin dahi elmi-fantastik romanı ile Denis Villeneuve-in vizual şahəsəri arasındakı qarşıdurma. Kitab Arrakisin daxili ekologiyasını, feodal ailələrin sirlərini və dini fəlsəfəni daha dərindən izah edir. Film isə gözqamaşdırıcı vizualları, möhtəşəm Hans Zimmer musiqiləri və dinamik döyüş səhnələri ilə tamaşaçını heyran edir. Sizin seçiminiz hansıdır?'
  }
];
