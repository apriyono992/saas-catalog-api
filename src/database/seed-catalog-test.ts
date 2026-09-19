import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq, like, or } from 'drizzle-orm';
import * as schema from './schema';

const SAMPLE_CATEGORY_IMAGES = [
  '/uploads/categories/5155ddcf-cf5e-41f3-858b-86a2bc14a4c2/5fd9cf1a-03ac-43e1-b94c-1a88fa100d1d.jpg',
  '/uploads/categories/073fd0b5-a454-4f08-b175-e97e8346a6ba/0370ddf9-5d9d-432a-9e31-75a02b6b1603.png',
  '/uploads/categories/e66e1792-ec4e-4f5c-87f1-5d6f9bc0b6e0/e1c71a23-a132-4d54-83c5-c2bb31de2ed2.jpg',
];

const SAMPLE_PRODUCT_IMAGES = [
  '/uploads/products/5ab9bad3-b93b-48cb-8d9b-ab3d40a1e50e/e1039291-ab38-4368-bd11-259afd47dcdb.png',
  '/uploads/products/b8d27631-20d5-4bbd-b611-36fd68ecbf41/f0459b4b-bbdc-4083-980d-9523368cfea7.jpg',
  '/uploads/products/b8d27631-20d5-4bbd-b611-36fd68ecbf41/23914065-e635-4b38-80f4-e5755fbcd4db.jpg',
];

interface NodeDef {
  name: string;
  slug: string;
  children?: NodeDef[];
}

// 10 Root categories each with hierarchy depth up to 5 levels
const CATEGORY_TREES: NodeDef[] = [
  // 1. Fashion Pria
  {
    name: 'Fashion Pria',
    slug: 'test-fashion-pria',
    children: [
      {
        name: 'Pakaian Pria',
        slug: 'test-pakaian-pria',
        children: [
          {
            name: 'Atasan Pria',
            slug: 'test-atasan-pria',
            children: [
              {
                name: 'Kemeja Pria',
                slug: 'test-kemeja-pria',
                children: [
                  { name: 'Kemeja Flanel Kasual', slug: 'test-kemeja-flanel-kasual' },
                  { name: 'Kemeja Oxford Formal', slug: 'test-kemeja-oxford-formal' },
                ],
              },
              {
                name: 'Kaos Pria',
                slug: 'test-kaos-pria',
                children: [
                  { name: 'Kaos Polos Combed 30s', slug: 'test-kaos-polos-30s' },
                ],
              },
            ],
          },
          {
            name: 'Celana Pria',
            slug: 'test-celana-pria',
            children: [
              {
                name: 'Celana Chino',
                slug: 'test-celana-chino',
                children: [
                  { name: 'Chino Slim Fit Stretch', slug: 'test-chino-slim-fit' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 2. Fashion Wanita
  {
    name: 'Fashion Wanita',
    slug: 'test-fashion-wanita',
    children: [
      {
        name: 'Pakaian Wanita',
        slug: 'test-pakaian-wanita',
        children: [
          {
            name: 'Dress & Gaun',
            slug: 'test-dress-gaun',
            children: [
              {
                name: 'Dress Kasual',
                slug: 'test-dress-kasual',
                children: [
                  { name: 'Floral Summer Midi Dress', slug: 'test-floral-midi-dress' },
                ],
              },
              {
                name: 'Dress Formal',
                slug: 'test-dress-formal',
                children: [
                  { name: 'Elegant Evening Gown', slug: 'test-evening-gown' },
                ],
              },
            ],
          },
          {
            name: 'Atasan Wanita',
            slug: 'test-atasan-wanita',
            children: [
              {
                name: 'Blouse Wanita',
                slug: 'test-blouse-wanita',
                children: [
                  { name: 'Silk Korean Blouse', slug: 'test-silk-korean-blouse' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 3. Elektronik & Komputer
  {
    name: 'Elektronik & Gadget',
    slug: 'test-elektronik-gadget',
    children: [
      {
        name: 'Komputer & Laptop',
        slug: 'test-komputer-laptop',
        children: [
          {
            name: 'Periferal & Aksesoris',
            slug: 'test-periferal-aksesoris',
            children: [
              {
                name: 'Keyboard Komputer',
                slug: 'test-keyboard-komputer',
                children: [
                  { name: 'Keyboard Mechanical Wireless', slug: 'test-mech-keyboard-wireless' },
                  { name: 'Keyboard Tenkeyless RGB', slug: 'test-keyboard-tkl-rgb' },
                ],
              },
              {
                name: 'Mouse Komputer',
                slug: 'test-mouse-komputer',
                children: [
                  { name: 'Mouse Gaming Ultra-Light 8K', slug: 'test-mouse-ultralight-8k' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 4. Handphone & Tablet
  {
    name: 'Handphone & Aksesoris',
    slug: 'test-handphone-aksesoris',
    children: [
      {
        name: 'Aksesoris Ponsel',
        slug: 'test-aksesoris-ponsel',
        children: [
          {
            name: 'Pelindung HP',
            slug: 'test-pelindung-hp',
            children: [
              {
                name: 'Casing Armor Shockproof',
                slug: 'test-casing-armor',
                children: [
                  { name: 'Rugged Military Drop Case', slug: 'test-rugged-case-mil' },
                ],
              },
            ],
          },
          {
            name: 'Audio Portable',
            slug: 'test-audio-portable',
            children: [
              {
                name: 'True Wireless Stereo',
                slug: 'test-tws-earphones',
                children: [
                  { name: 'Active Noise Cancelling TWS', slug: 'test-anc-tws-pro' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 5. Perlengkapan Rumah
  {
    name: 'Perlengkapan Rumah',
    slug: 'test-perlengkapan-rumah',
    children: [
      {
        name: 'Dekorasi & Interior',
        slug: 'test-dekorasi-interior',
        children: [
          {
            name: 'Hiasan Dinding',
            slug: 'test-hiasan-dinding',
            children: [
              {
                name: 'Bingkai Foto Kayu',
                slug: 'test-bingkai-foto-kayu',
                children: [
                  { name: 'Bingkai Jati Minimalis A4', slug: 'test-bingkai-jati-a4' },
                ],
              },
            ],
          },
          {
            name: 'Pencahayaan',
            slug: 'test-pencahayaan',
            children: [
              {
                name: 'Lampu Meja Kerja',
                slug: 'test-lampu-meja-kerja',
                children: [
                  { name: 'Lampu LED Dimmable Smart Touch', slug: 'test-led-dimmable-touch' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 6. Olahraga & Outdoor
  {
    name: 'Olahraga & Fitness',
    slug: 'test-olahraga-fitness',
    children: [
      {
        name: 'Alat Fitness & Gym',
        slug: 'test-alat-fitness-gym',
        children: [
          {
            name: 'Latihan Beban',
            slug: 'test-latihan-beban',
            children: [
              {
                name: 'Dumbbell & Barbell',
                slug: 'test-dumbbell-barbell',
                children: [
                  { name: 'Set Dumbbell Karet Hexagonal', slug: 'test-dumbbell-hexagonal' },
                ],
              },
            ],
          },
          {
            name: 'Yoga & Senam',
            slug: 'test-yoga-senam',
            children: [
              {
                name: 'Matras Olahraga',
                slug: 'test-matras-olahraga',
                children: [
                  { name: 'Matras Yoga TPE Anti-Slip 8mm', slug: 'test-matras-yoga-tpe-8mm' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 7. Otomotif
  {
    name: 'Otomotif & Aksesoris',
    slug: 'test-otomotif-aksesoris',
    children: [
      {
        name: 'Aksesoris Mobil',
        slug: 'test-aksesoris-mobil',
        children: [
          {
            name: 'Interior & Kenyamanan',
            slug: 'test-interior-kenyamanan',
            children: [
              {
                name: 'Pengharum Kabin',
                slug: 'test-pengharum-kabin',
                children: [
                  { name: 'Diffuser Aromaterapi Tenaga Surya', slug: 'test-diffuser-surya-mobil' },
                ],
              },
            ],
          },
          {
            name: 'Perawatan Bodi',
            slug: 'test-perawatan-bodi',
            children: [
              {
                name: 'Detailing & Proteksi',
                slug: 'test-detailing-proteksi',
                children: [
                  { name: 'Nano Ceramic Coating Spray 500ml', slug: 'test-nano-coating-spray' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 8. Buku & Alat Tulis
  {
    name: 'Buku & Alat Tulis',
    slug: 'test-buku-alat-tulis',
    children: [
      {
        name: 'Alat Tulis Kantor',
        slug: 'test-alat-tulis-kantor',
        children: [
          {
            name: 'Buku Catatan & Agenda',
            slug: 'test-buku-catatan-agenda',
            children: [
              {
                name: 'Journal Organizer',
                slug: 'test-journal-organizer',
                children: [
                  { name: 'Hardcover Leather Daily Planner', slug: 'test-leather-daily-planner' },
                ],
              },
            ],
          },
          {
            name: 'Perlengkapan Seni',
            slug: 'test-perlengkapan-seni',
            children: [
              {
                name: 'Cat Lukis',
                slug: 'test-cat-lukis',
                children: [
                  { name: 'Set Cat Akrilik 24 Warna Artist Grade', slug: 'test-cat-akrilik-24w' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 9. Kecantikan & Perawatan
  {
    name: 'Kecantikan & Skincare',
    slug: 'test-kecantikan-skincare',
    children: [
      {
        name: 'Perawatan Wajah',
        slug: 'test-perawatan-wajah',
        children: [
          {
            name: 'Serum Wajah',
            slug: 'test-serum-wajah',
            children: [
              {
                name: 'Serum Anti Aging',
                slug: 'test-serum-anti-aging',
                children: [
                  { name: 'Retinol 1% & Multi-Peptide Serum 30ml', slug: 'test-retinol-peptide-serum' },
                ],
              },
              {
                name: 'Serum Mencerahkan',
                slug: 'test-serum-mencerahkan',
                children: [
                  { name: 'Vitamin C 15% Brightening Glow Serum', slug: 'test-vit-c-glow-serum' },
                ],
              },
            ],
          },
          {
            name: 'Pembersih Wajah',
            slug: 'test-pembersih-wajah',
            children: [
              {
                name: 'Facial Wash Gentle',
                slug: 'test-facial-wash-gentle',
                children: [
                  { name: 'Low pH Amino Acid Facial Cleanser', slug: 'test-low-ph-cleanser' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // 10. Makanan & Minuman
  {
    name: 'Makanan & Minuman',
    slug: 'test-makanan-minuman',
    children: [
      {
        name: 'Kopi & Teh Nusantara',
        slug: 'test-kopi-teh-nusantara',
        children: [
          {
            name: 'Biji Kopi Specialty',
            slug: 'test-biji-kopi-specialty',
            children: [
              {
                name: 'Single Origin Arabika',
                slug: 'test-single-origin-arabika',
                children: [
                  { name: 'Biji Kopi Gayo Wine Process 250g', slug: 'test-kopi-gayo-wine-250g' },
                  { name: 'Biji Kopi Toraja Sapan Specialty 250g', slug: 'test-kopi-toraja-sapan-250g' },
                ],
              },
            ],
          },
          {
            name: 'Minuman Herbal Alami',
            slug: 'test-minuman-herbal-alami',
            children: [
              {
                name: 'Teh Herbal Celup',
                slug: 'test-teh-herbal-celup',
                children: [
                  { name: 'Teh Chamomile & Lavender Organik 20 Tea Bags', slug: 'test-teh-chamomile-org' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// 40 distinct product definitions that get seeded per tenant
const PRODUCT_TEMPLATES = [
  {
    name: 'Kemeja Flanel Kotak Merah Kasual Slim Fit',
    slugBase: 'test-flanel-kotak-merah',
    desc: 'Kemeja flanel pria bahan katun premium lembut, pola kotak-kotak modern cocok untuk gaya kasual sehari-hari maupun semi-formal. [TEST_CATALOG_SEED]',
    basePrice: 179000,
    targetCatSlug: 'test-kemeja-flanel-kasual',
    extraCatSlugs: ['test-atasan-pria', 'test-pakaian-pria'],
  },
  {
    name: 'Kemeja Oxford Pria Putih Bersih Formal',
    slugBase: 'test-oxford-putih-formal',
    desc: 'Kemeja oxford lengan panjang bahan breathable cotton, kerah button-down rapi untuk kantor atau acara resmi. [TEST_CATALOG_SEED]',
    basePrice: 229000,
    targetCatSlug: 'test-kemeja-oxford-formal',
    extraCatSlugs: ['test-fashion-pria'],
  },
  {
    name: 'Kaos Polos Combed 30s Hitam Pekat Anti Susut',
    slugBase: 'test-kaos-polos-30s-hitam',
    desc: 'Kaos oblong katun combed 30s premium reaktif, jahitan rantai ganda awet dan nyaman seharian. [TEST_CATALOG_SEED]',
    basePrice: 59000,
    targetCatSlug: 'test-kaos-polos-30s',
    extraCatSlugs: ['test-atasan-pria'],
  },
  {
    name: 'Celana Chino Pria Slim Fit Stretch Khaki',
    slugBase: 'test-chino-stretch-khaki',
    desc: 'Celana panjang chino bahan twill elastis lentur, fitting slim fit pas di kaki tanpa terasa sesak. [TEST_CATALOG_SEED]',
    basePrice: 189000,
    targetCatSlug: 'test-chino-slim-fit',
    extraCatSlugs: ['test-celana-pria'],
  },
  {
    name: 'Floral Summer Midi Dress Vintage Korea',
    slugBase: 'test-floral-summer-dress',
    desc: 'Gaun midi motif bunga musim panas bahan sifon jatuh lembut dengan potongan pinggang feminin. [TEST_CATALOG_SEED]',
    basePrice: 259000,
    targetCatSlug: 'test-floral-midi-dress',
    extraCatSlugs: ['test-dress-gaun', 'test-fashion-wanita'],
  },
  {
    name: 'Elegant Evening Gown Navy Blue Satin',
    slugBase: 'test-evening-gown-navy',
    desc: 'Gaun pesta panjang satin sutra mewah dengan belahan anggun, pilihan sempurna untuk pesta malam. [TEST_CATALOG_SEED]',
    basePrice: 599000,
    targetCatSlug: 'test-evening-gown',
    extraCatSlugs: ['test-fashion-wanita'],
  },
  {
    name: 'Silk Korean Blouse Lengan Panjang Pastel',
    slugBase: 'test-silk-korean-blouse',
    desc: 'Blouse sutra sutra sintetis lembut model Korea dengan aksen pita leher elegan dan minimalis. [TEST_CATALOG_SEED]',
    basePrice: 145000,
    targetCatSlug: 'test-silk-korean-blouse',
    extraCatSlugs: ['test-atasan-wanita'],
  },
  {
    name: 'Mechanical Keyboard Wireless Tri-Mode Gasket Mount',
    slugBase: 'test-keyboard-wireless-gasket',
    desc: 'Keyboard mekanikal 75% hot-swappable dengan switch pre-lubed linier dan konektivitas Bluetooth, 2.4G, & kabel. [TEST_CATALOG_SEED]',
    basePrice: 789000,
    targetCatSlug: 'test-mech-keyboard-wireless',
    extraCatSlugs: ['test-keyboard-komputer', 'test-elektronik-gadget'],
  },
  {
    name: 'Keyboard TKL RGB Backlight PBT Keycaps',
    slugBase: 'test-keyboard-tkl-rgb-pbt',
    desc: 'Keyboard tenkeyless kabel braided dengan pencahayaan RGB per tombol dan keycaps PBT tahan pudar. [TEST_CATALOG_SEED]',
    basePrice: 429000,
    targetCatSlug: 'test-keyboard-tkl-rgb',
    extraCatSlugs: ['test-periferal-aksesoris'],
  },
  {
    name: 'Mouse Gaming Ultra-Light 49g PAW3395 Sensor',
    slugBase: 'test-mouse-ultralight-49g',
    desc: 'Mouse gaming nirkabel super ringan hanya 49 gram dengan polling rate hingga 8KHz dan sensor 26.000 DPI. [TEST_CATALOG_SEED]',
    basePrice: 549000,
    targetCatSlug: 'test-mouse-ultralight-8k',
    extraCatSlugs: ['test-periferal-aksesoris'],
  },
  {
    name: 'Rugged Military Drop Case iPhone 15 Pro Max',
    slugBase: 'test-rugged-case-ip15pm',
    desc: 'Casing pelindung tahan benturan sertifikasi militer MIL-STD-810G dengan kickstand lipat terintegrasi. [TEST_CATALOG_SEED]',
    basePrice: 129000,
    targetCatSlug: 'test-rugged-case-mil',
    extraCatSlugs: ['test-casing-armor', 'test-handphone-aksesoris'],
  },
  {
    name: 'Active Noise Cancelling TWS Hi-Res LDAC',
    slugBase: 'test-anc-tws-hires-ldac',
    desc: 'Earphone TWS dengan peredam kebisingan aktif hybrid hingga 45dB, driver 11mm dinamis dan daya tahan baterai 35 jam. [TEST_CATALOG_SEED]',
    basePrice: 699000,
    targetCatSlug: 'test-anc-tws-pro',
    extraCatSlugs: ['test-audio-portable'],
  },
  {
    name: 'Bingkai Foto Kayu Jati Minimalis A4 Kaca Akrilik',
    slugBase: 'test-bingkai-jati-a4-akrilik',
    desc: 'Bingkai foto kayu jati solid finishing natural rustic aesthetic cocok untuk sertifikat dan poster kamar. [TEST_CATALOG_SEED]',
    basePrice: 85000,
    targetCatSlug: 'test-bingkai-jati-a4',
    extraCatSlugs: ['test-hiasan-dinding', 'test-perlengkapan-rumah'],
  },
  {
    name: 'Lampu Meja LED Dimmable Smart Touch USB Rechargeable',
    slugBase: 'test-lampu-led-dimmable-touch',
    desc: 'Lampu belajar arsitek hemat energi dengan 3 tingkat temperatur warna, proteksi mata, dan port charging USB. [TEST_CATALOG_SEED]',
    basePrice: 165000,
    targetCatSlug: 'test-led-dimmable-touch',
    extraCatSlugs: ['test-pencahayaan'],
  },
  {
    name: 'Set Dumbbell Karet Hexagonal 10KG (2x5KG)',
    slugBase: 'test-set-dumbbell-hex-10kg',
    desc: 'Sepasang dumbell besi cor lapis karet padat bentuk heksagonal anti gelinding dan aman untuk lantai. [TEST_CATALOG_SEED]',
    basePrice: 320000,
    targetCatSlug: 'test-dumbbell-hexagonal',
    extraCatSlugs: ['test-latihan-beban', 'test-olahraga-fitness'],
  },
  {
    name: 'Matras Yoga TPE Tebal 8mm Anti-Slip Eco-Friendly',
    slugBase: 'test-matras-yoga-tpe-8mm',
    desc: 'Matras senam yoga pilates dua sisi tekstur anti licin, empuk melindungi lutut dan persendian. [TEST_CATALOG_SEED]',
    basePrice: 139000,
    targetCatSlug: 'test-matras-yoga-tpe-8mm',
    extraCatSlugs: ['test-yoga-senam'],
  },
  {
    name: 'Diffuser Aromaterapi Mobil Tenaga Surya Solar Rotor',
    slugBase: 'test-diffuser-solar-kabin',
    desc: 'Pengharum kabin mobil otomatis berputar saat terkena cahaya matahari, menyebarkan wangi esensial merata. [TEST_CATALOG_SEED]',
    basePrice: 99000,
    targetCatSlug: 'test-diffuser-surya-mobil',
    extraCatSlugs: ['test-interior-kenyamanan', 'test-otomotif-aksesoris'],
  },
  {
    name: 'Nano Ceramic Coating Spray Mobil 500ml Efek Daun Talas',
    slugBase: 'test-nano-coating-spray-500ml',
    desc: 'Semprotan pelapis bodi kendaraan efek hidrofobik mengkilapkan cat dan melindungi dari goresan halus & sinar UV. [TEST_CATALOG_SEED]',
    basePrice: 115000,
    targetCatSlug: 'test-nano-coating-spray',
    extraCatSlugs: ['test-perawatan-bodi'],
  },
  {
    name: 'Hardcover Leather Daily Planner Agenda 2026',
    slugBase: 'test-leather-daily-planner-2026',
    desc: 'Buku catatan harian berbalut kulit sintetis premium dengan pita pembatas dan kertas tebal 100gsm bebas tembus tinta. [TEST_CATALOG_SEED]',
    basePrice: 75000,
    targetCatSlug: 'test-leather-daily-planner',
    extraCatSlugs: ['test-buku-catatan-agenda', 'test-buku-alat-tulis'],
  },
  {
    name: 'Set Cat Akrilik 24 Warna Artist Grade 12ml',
    slugBase: 'test-cat-akrilik-24-warna',
    desc: 'Cat akrilik pigmen pekat cepat kering tahan air untuk kanvas, kayu, keramik, dan kertas seni. [TEST_CATALOG_SEED]',
    basePrice: 110000,
    targetCatSlug: 'test-cat-akrilik-24w',
    extraCatSlugs: ['test-perlengkapan-seni'],
  },
  {
    name: 'Retinol 1% & Multi-Peptide Youth Restoring Serum 30ml',
    slugBase: 'test-retinol-peptide-serum-30ml',
    desc: 'Serum anti-penuaan dini membantu menyamarkan garis halus, meregenerasi tekstur kulit, dan menjaga kekenyalan wajah. [TEST_CATALOG_SEED]',
    basePrice: 149000,
    targetCatSlug: 'test-retinol-peptide-serum',
    extraCatSlugs: ['test-serum-anti-aging', 'test-kecantikan-skincare'],
  },
  {
    name: 'Vitamin C 15% Pure Brightening Glow Serum 20ml',
    slugBase: 'test-vit-c-glow-serum-20ml',
    desc: 'Serum konsentrasi tinggi vitamin C murni dengan asam ferulat untuk mencerahkan noda hitam dan meratakan warna kulit. [TEST_CATALOG_SEED]',
    basePrice: 135000,
    targetCatSlug: 'test-vit-c-glow-serum',
    extraCatSlugs: ['test-serum-mencerahkan'],
  },
  {
    name: 'Low pH Amino Acid Facial Gentle Cleanser 120ml',
    slugBase: 'test-low-ph-amino-cleanser-120ml',
    desc: 'Sabun cuci muka formula asam amino seimbang pH 5.5, membersihkan kotoran tanpa membuat kulit kering tertarik. [TEST_CATALOG_SEED]',
    basePrice: 89000,
    targetCatSlug: 'test-low-ph-cleanser',
    extraCatSlugs: ['test-pembersih-wajah'],
  },
  {
    name: 'Biji Kopi Gayo Wine Process Arabika Specialty 250g',
    slugBase: 'test-kopi-gayo-wine-250g',
    desc: 'Biji kopi sangrai specialty dari dataran tinggi Aceh Gayo proses pascapanen winey fermentation dengan cita rasa fruity manis. [TEST_CATALOG_SEED]',
    basePrice: 125000,
    targetCatSlug: 'test-kopi-gayo-wine-250g',
    extraCatSlugs: ['test-single-origin-arabika', 'test-makanan-minuman'],
  },
  {
    name: 'Biji Kopi Toraja Sapan Specialty Grade 1 250g',
    slugBase: 'test-kopi-toraja-sapan-250g',
    desc: 'Kopi Arabika Toraja Sapan aroma rempah khas herbal dengan body tebal dan tingkat keasaman seimbang. [TEST_CATALOG_SEED]',
    basePrice: 115000,
    targetCatSlug: 'test-kopi-toraja-sapan-250g',
    extraCatSlugs: ['test-single-origin-arabika'],
  },
  {
    name: 'Teh Chamomile & Lavender Organik Calming Blend 20 Bags',
    slugBase: 'test-teh-chamomile-lavender-20b',
    desc: 'Racikan bunga kamomil dan lavender kering organik membantu menenangkan pikiran dan meningkatkan kualitas tidur malam. [TEST_CATALOG_SEED]',
    basePrice: 65000,
    targetCatSlug: 'test-teh-chamomile-org',
    extraCatSlugs: ['test-minuman-herbal-alami'],
  },
  // Additional varied items to hit ~35 products
  {
    name: 'Kemeja Batik Pria Slim Fit Motif Parang Modern',
    slugBase: 'test-batik-parang-modern',
    desc: 'Batik katun primisima lapisan furing halus, corak tradisional modern untuk acara pernikahan dan kantor. [TEST_CATALOG_SEED]',
    basePrice: 210000,
    targetCatSlug: 'test-kemeja-oxford-formal',
    extraCatSlugs: ['test-fashion-pria'],
  },
  {
    name: 'Kaos Henley Lengan Panjang Vintage Waffle Knit',
    slugBase: 'test-henley-waffle-knit',
    desc: 'Baju kaos henley 3 kancing tekstur waffle hangat dan adem dipakai untuk outfit santai musim gugur. [TEST_CATALOG_SEED]',
    basePrice: 95000,
    targetCatSlug: 'test-kaos-polos-30s',
    extraCatSlugs: ['test-atasan-pria'],
  },
  {
    name: 'Celana Cargo Jogger Pria Tali Serut Streetwear',
    slugBase: 'test-cargo-jogger-streetwear',
    desc: 'Celana kargo jogger banyak saku fungsional dengan karet pinggang elastis dan ujung pergelangan kaki rib. [TEST_CATALOG_SEED]',
    basePrice: 165000,
    targetCatSlug: 'test-chino-slim-fit',
    extraCatSlugs: ['test-celana-pria'],
  },
  {
    name: 'Cardigan Rajut Oversize Wanita Knitwear Lembut',
    slugBase: 'test-cardigan-rajut-oversize',
    desc: 'Outer cardigan rajut tebal halus model dropped shoulder gaya kasual santai Korean style. [TEST_CATALOG_SEED]',
    basePrice: 135000,
    targetCatSlug: 'test-silk-korean-blouse',
    extraCatSlugs: ['test-atasan-wanita'],
  },
  {
    name: 'Headphone Stand Aluminium dengan USB Hub 3.0',
    slugBase: 'test-headphone-stand-aluminium',
    desc: 'Gantungan headphone meja solid aluminium dengan bantalan silikon pelindung dan 3 port USB tambahan. [TEST_CATALOG_SEED]',
    basePrice: 149000,
    targetCatSlug: 'test-periferal-aksesoris',
    extraCatSlugs: ['test-elektronik-gadget'],
  },
  {
    name: 'Power Bank Magnetik Wireless 10000mAh Fast Charging',
    slugBase: 'test-powerbank-magsafe-10k',
    desc: 'Pengisi daya nirkabel magnetik menempel kuat di bodi smartphone dengan indikator LED persentase baterai. [TEST_CATALOG_SEED]',
    basePrice: 289000,
    targetCatSlug: 'test-aksesoris-ponsel',
    extraCatSlugs: ['test-handphone-aksesoris'],
  },
  {
    name: 'Aromatherapy Reed Diffuser Minyak Esensial 100ml',
    slugBase: 'test-reed-diffuser-essential-100ml',
    desc: 'Pewangi ruangan stik rotan natural aroma English Pear & Freesia menyegarkan kamar hingga 60 hari. [TEST_CATALOG_SEED]',
    basePrice: 89000,
    targetCatSlug: 'test-dekorasi-interior',
    extraCatSlugs: ['test-perlengkapan-rumah'],
  },
  {
    name: 'Tali Skipping Speed Jump Rope Bearing Baja',
    slugBase: 'test-speed-jump-rope-steel',
    desc: 'Tali lompat tali kabel kawat baja berlapis PVC dengan dual bearing putaran 360 derajat super cepat. [TEST_CATALOG_SEED]',
    basePrice: 45000,
    targetCatSlug: 'test-alat-fitness-gym',
    extraCatSlugs: ['test-olahraga-fitness'],
  },
  {
    name: 'Sunscreen Gel SPF 50+ PA++++ Ringan Matte',
    slugBase: 'test-sunscreen-spf50-matte',
    desc: 'Tabir surya tekstur gel air bebas lengket dan tanpa whitecast, diperkaya ekstrak Centella Asiatica. [TEST_CATALOG_SEED]',
    basePrice: 98000,
    targetCatSlug: 'test-perawatan-wajah',
    extraCatSlugs: ['test-kecantikan-skincare'],
  },
  {
    name: 'Drip Bag Coffee Box Isi 10 Sachet Nusantara Blend',
    slugBase: 'test-drip-bag-coffee-10s',
    desc: 'Kopi tetes praktis siap seduh kapan saja di kantor atau traveling tanpa perlu alat seduh khusus. [TEST_CATALOG_SEED]',
    basePrice: 79000,
    targetCatSlug: 'test-biji-kopi-specialty',
    extraCatSlugs: ['test-makanan-minuman'],
  },
];

async function seedCatalog() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('--- Seeding Test Catalog (Categories, Subcategories & Products) ---');

  // Fetch all active tenants
  const tenants = await db.query.tenants.findMany({
    where: eq(schema.tenants.status, 'active'),
  });

  if (tenants.length === 0) {
    console.error('No active tenants found to seed catalog.');
    await pool.end();
    return;
  }

  console.log(`Found ${tenants.length} active store(s): ${tenants.map((t) => t.name).join(', ')}`);

  // Fetch available marketplaces for product links
  const marketplaces = await db.query.marketplaces.findMany();
  const toped = marketplaces.find((m) => m.slug === 'tokopedia') ?? marketplaces[0];
  const shopee = marketplaces.find((m) => m.slug === 'shopee') ?? marketplaces[1] ?? marketplaces[0];

  for (const tenant of tenants) {
    console.log(`\n========================================`);
    console.log(`Seeding Store: "${tenant.name}" (${tenant.id})`);
    console.log(`========================================`);

    // Recursive helper to seed category tree
    const categorySlugToId = new Map<string, string>();
    let catImageCounter = 0;

    async function seedNode(node: NodeDef, parentId: string | null = null, depth = 1) {
      const tenantCategorySlug = `${node.slug}-${tenant.id.slice(0, 4)}`;
      const assignedImage = SAMPLE_CATEGORY_IMAGES[catImageCounter % SAMPLE_CATEGORY_IMAGES.length];
      catImageCounter++;

      // Upsert category by tenantId & slug
      const existing = await db.query.categories.findFirst({
        where: and(
          eq(schema.categories.tenantId, tenant.id),
          eq(schema.categories.slug, tenantCategorySlug)
        ),
      });

      let categoryId: string;
      if (existing) {
        categoryId = existing.id;
        await db
          .update(schema.categories)
          .set({
            name: node.name,
            parentId,
            imageUrl: assignedImage,
            updatedAt: new Date(),
          })
          .where(eq(schema.categories.id, existing.id));
      } else {
        const [inserted] = await db
          .insert(schema.categories)
          .values({
            tenantId: tenant.id,
            parentId,
            name: node.name,
            slug: tenantCategorySlug,
            imageUrl: assignedImage,
          })
          .returning();
        categoryId = inserted.id;
      }

      categorySlugToId.set(node.slug, categoryId);

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          await seedNode(child, categoryId, depth + 1);
        }
      }
    }

    // 1. Seed Categories & Deep Subcategories
    console.log(`Inserting 10 category trees with hierarchy (max depth 5)...`);
    for (const tree of CATEGORY_TREES) {
      await seedNode(tree, null, 1);
    }
    console.log(`✓ Seeded ${categorySlugToId.size} categories/subcategories for "${tenant.name}"`);

    // 2. Seed Products
    console.log(`Inserting products with random prices, strike prices & multi-category links...`);
    let seededProductsCount = 0;

    for (let i = 0; i < PRODUCT_TEMPLATES.length; i++) {
      const template = PRODUCT_TEMPLATES[i];
      const productSlug = `${template.slugBase}-${tenant.id.slice(0, 4)}`;

      const primaryCatId = categorySlugToId.get(template.targetCatSlug) || null;
      const extraCatIds = (template.extraCatSlugs || [])
        .map((slug) => categorySlugToId.get(slug))
        .filter((id): id is string => Boolean(id));

      const allCatIds = Array.from(
        new Set([primaryCatId, ...extraCatIds].filter((id): id is string => Boolean(id)))
      );

      // Randomize price slightly around basePrice (e.g. ±10%)
      const priceVariation = Math.round((Math.random() * 0.2 - 0.1) * template.basePrice);
      const randomizedBasePrice = Math.max(15000, Math.round((template.basePrice + priceVariation) / 1000) * 1000);

      // Random markup percentage between 20% and 45%
      const discountPct = Math.floor(Math.random() * 26) + 20; // 20% to 45%
      const strikePrice = Math.round((randomizedBasePrice * (1 + discountPct / 100)) / 1000) * 1000;

      // Status variation: 85% published, 10% draft, 5% archived
      let status: 'published' | 'draft' | 'archived' = 'published';
      if (i % 10 === 7) status = 'draft';
      if (i % 20 === 19) status = 'archived';

      // Check if product already exists
      const existingProduct = await db.query.products.findFirst({
        where: and(
          eq(schema.products.tenantId, tenant.id),
          eq(schema.products.slug, productSlug)
        ),
      });

      let productId: string;
      if (existingProduct) {
        productId = existingProduct.id;
        await db
          .update(schema.products)
          .set({
            categoryId: primaryCatId,
            name: template.name,
            description: template.desc,
            basePrice: randomizedBasePrice.toString(),
            strikePrice: strikePrice.toString(),
            status,
            deletedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.products.id, existingProduct.id));
      } else {
        const [inserted] = await db
          .insert(schema.products)
          .values({
            tenantId: tenant.id,
            categoryId: primaryCatId,
            name: template.name,
            slug: productSlug,
            description: template.desc,
            basePrice: randomizedBasePrice.toString(),
            strikePrice: strikePrice.toString(),
            status,
            deletedAt: null,
          })
          .returning();
        productId = inserted.id;
      }

      // Sync multi-category junction table
      await db
        .delete(schema.productCategories)
        .where(eq(schema.productCategories.productId, productId));

      if (allCatIds.length > 0) {
        await db
          .insert(schema.productCategories)
          .values(allCatIds.map((cId) => ({ productId, categoryId: cId })))
          .onConflictDoNothing();
      }

      // Sync product images (2 images per product, rotating samples)
      await db
        .delete(schema.productImages)
        .where(eq(schema.productImages.productId, productId));

      const img1 = SAMPLE_PRODUCT_IMAGES[i % SAMPLE_PRODUCT_IMAGES.length];
      const img2 = SAMPLE_PRODUCT_IMAGES[(i + 1) % SAMPLE_PRODUCT_IMAGES.length];

      await db.insert(schema.productImages).values([
        { productId, url: img1, sortOrder: 0 },
        { productId, url: img2, sortOrder: 1 },
      ]);

      // Sync marketplace links if marketplaces exist
      await db
        .delete(schema.marketplaceLinks)
        .where(eq(schema.marketplaceLinks.productId, productId));

      if (toped) {
        await db.insert(schema.marketplaceLinks).values({
          productId,
          marketplaceId: toped.id,
          marketplaceName: toped.name,
          url: `https://www.tokopedia.com/product/${productSlug}`,
          sortOrder: 0,
        });
      }
      if (shopee) {
        await db.insert(schema.marketplaceLinks).values({
          productId,
          marketplaceId: shopee.id,
          marketplaceName: shopee.name,
          url: `https://shopee.co.id/product/${productSlug}`,
          sortOrder: 1,
        });
      }

      seededProductsCount++;
    }

    console.log(`✓ Seeded ${seededProductsCount} products with images & marketplace links for "${tenant.name}"`);
  }

  console.log('\n✓ Test Catalog Seeder Finished Successfully!');
  await pool.end();
}

seedCatalog().catch((err) => {
  console.error('Error seeding test catalog:', err);
  process.exit(1);
});
