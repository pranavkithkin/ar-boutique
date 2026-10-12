export interface JournalArticle {
  slug: string
  title: string
  excerpt: string
  category: "Craft & Heritage" | "Style Guide" | "Brand Story" | "Inspiration" | "Fabric Spotlight"
  date: string
  readTime: string
  author: string
  imageSrc: string
  featured?: boolean
  content: {
    leadParagraph: string
    sections: {
      heading?: string
      body: string
      quote?: string
    }[]
  }
}

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: "poetry-of-handcrafted-zardozi",
    title: "The Poetry of Handcrafted Zardozi: Behind Our Signature Embroidery",
    excerpt:
      "A deep dive into the ancestral metallurgic needlework that defines our bespoke collection, where each motif takes up to forty hours of artisan devotion.",
    category: "Craft & Heritage",
    date: "October 10, 2026",
    readTime: "5 min read",
    author: "Atelier AR",
    imageSrc: "/images/artisan_embroidery.jpg",
    featured: true,
    content: {
      leadParagraph:
        "True luxury is measured in hours, not seasons. Within the quiet ateliers of our master craftsmen, the rhythmic cadence of the needle tells a story passed down through generations—a sacred dialogue between golden threads and rich silk canvas.",
      sections: [
        {
          heading: "An Ancestral Art Form",
          body:
            "Zardozi, derived from the Persian words 'zar' meaning gold and 'dozi' meaning sewing, is an art form that once adorned the regal courts of Mughal royalty. Our artisans use genuine metallic wires, delicate dabka coiled ribbons, and lustrous micro-sequins, meticulously anchoring each element by hand over taut wooden adda frames.",
          quote: "Each stitch is not merely decorative; it is an enduring tribute to the hands that shaped it.",
        },
        {
          heading: "The Anatomy of a Motif",
          body:
            "Before a needle ever touches fabric, our designs begin with hand-traced stencils drawn with natural charcoal powders. Geometric florets, curving jaal vines, and stylized peacocks are plotted with architectural precision to complement the drape and flow of the garment in motion.",
        },
        {
          heading: "Preserving Heritage for the Modern Wardrobe",
          body:
            "While honor for tradition remains unyielding, AR Boutique reimagines these historic techniques for contemporary lifestyles. We balance opulent metallic flourishes with breathable cotton-silks and gossamer organzas, crafting heirloom ensembles that feel as effortless to wear as they are breathtaking to behold.",
        },
      ],
    },
  },
  {
    slug: "how-to-transition-your-wardrobe-for-the-new-season",
    title: "How to Transition Your Wardrobe for the New Season",
    excerpt:
      "Explore curated techniques for layering diaphanous dupattas, tailored co-ord sets, and timeless silhouettes through shifting climates.",
    category: "Style Guide",
    date: "October 06, 2026",
    readTime: "4 min read",
    author: "Styling Studio",
    imageSrc: "/images/journal_style.jpg",
    content: {
      leadParagraph:
        "As seasons gently shift, the art of dressing lies in versatile layering and adaptable textiles that balance comfort with an unmistakable air of polish.",
      sections: [
        {
          heading: "The Power of the Modular Co-ord",
          body:
            "Modern ethnic dressing thrives on versatility. A finely tailored short kurti paired with wide-leg trousers can effortlessly navigate an afternoon gallery viewing, and later be elevated for evening dinners with an artisanal raw-silk jacket.",
          quote: "True versatility allows an ensemble to reinvent itself across occasions without losing its essential poise.",
        },
        {
          heading: "Texture Over Weight",
          body:
            "Rather than turning to heavy materials, transition using multi-tonal weaves and rich tactile textures. Layering a tissue organza dupatta over a structured raw silk tunic adds dimension, depth, and a subtle play of light.",
        },
      ],
    },
  },
  {
    slug: "the-making-of-our-latest-collection",
    title: "Behind the Scenes: The Making of Our Latest Collection",
    excerpt:
      "From initial charcoal sketches to the final hand-stitched hem, journey inside the creative sanctuary behind the new seasonal release.",
    category: "Brand Story",
    date: "October 02, 2026",
    readTime: "6 min read",
    author: "Creative Direction",
    imageSrc: "/images/journal_bts_2.jpg",
    content: {
      leadParagraph:
        "Every collection begins months before its unveiling—with botanical color swatches, vintage textile archives, and endless cups of saffron tea in our design studio.",
      sections: [
        {
          heading: "Finding Inspiration in Architecture",
          body:
            "This season's architectural forms draw directly from arched jali screens and marble lattice courtyards. We translated these geometric proportions into clean, flowing silhouettes that frame the wearer with quiet dignity.",
        },
        {
          heading: "Ethical Craft and Unhurried Production",
          body:
            "We reject the breakneck cycle of fast fashion. Each batch is created in limited runs, ensuring our artisan partners work with fair compensation, sustainable dignity, and the unhurried patience their mastery demands.",
          quote: "When you create with intention, the resulting garments carry a soul that mass production can never replicate.",
        },
      ],
    },
  },
  {
    slug: "effortless-looks-for-your-festive-getaway",
    title: "5 Effortless Looks for Your Next Festive Getaway",
    excerpt:
      "Lightweight silks, breathable cotton-satins, and wrinkle-resistant embroideries designed to pack lightly and arrive impeccably.",
    category: "Inspiration",
    date: "September 28, 2026",
    readTime: "4 min read",
    author: "Editorial Team",
    imageSrc: "/images/journal_inspiration.jpg",
    content: {
      leadParagraph:
        "Destination celebrations demand garments that travel effortlessly, resist the rigors of flight, and unfold into immaculate grace upon arrival.",
      sections: [
        {
          heading: "1. The Sangeet Anarkali in Crinkled Chiffon",
          body:
            "Flowing, weightless, and delightfully crease-tolerant, crinkled chiffon with subtle gota accents ensures effortless twirls from welcome festivities to late-night celebrations.",
        },
        {
          heading: "2. The Minimalist Silk Co-ord",
          body:
            "A monochromatic pure silk set delivers maximum impact with minimal bulk. Style it with sculptural gold hoops for brunch, or drape a jewel-toned pashmina for sunset gatherings.",
          quote: "Pack fewer pieces of higher distinction, and let intentional styling do the rest.",
        },
        {
          heading: "3. Breezy Chanderi Dresses",
          body:
            "Chanderi's natural sheer luster and crisp breathability keep you cool in coastal and desert climates alike, bridging modern leisure with timeless tradition.",
        },
      ],
    },
  },
  {
    slug: "the-architecture-of-silhouette",
    title: "The Architecture of Silhouette: Reimagining Traditional Forms",
    excerpt:
      "How contemporary tailoring breathes new ease and kinetic freedom into the classical anarkali, sharara, and straight-cut kurta.",
    category: "Craft & Heritage",
    date: "September 20, 2026",
    readTime: "5 min read",
    author: "Master Patternmaker",
    imageSrc: "/images/hero_1_desktop_v5.png",
    content: {
      leadParagraph:
        "A garment must flatter in stillness, yet come alive in motion. Our patternmakers spend weeks perfecting armhole depths, shoulder pitch, and flare volume to ensure effortless fluidity.",
      sections: [
        {
          heading: "Kinetic Freedom in Heritage Wear",
          body:
            "Historically, festive wear was often heavy and restrictive. By engineering hidden gussets and lightweight canvas interlinings, we have liberated traditional silhouettes, enabling graceful ease without compromising structural grandeur.",
          quote: "True beauty never demands that comfort be sacrificed in its pursuit.",
        },
      ],
    },
  },
  {
    slug: "sustainable-elegance-natural-weaves",
    title: "Sustainable Elegance: The Natural Weaves of Silk and Chanderi",
    excerpt:
      "An exploration of chemical-free handloom weaving, vegetable dyes, and why natural fibers only grow more radiant with time.",
    category: "Fabric Spotlight",
    date: "September 14, 2026",
    readTime: "4 min read",
    author: "Textile Archivist",
    imageSrc: "/images/hero_2_desktop_v5.png",
    content: {
      leadParagraph:
        "In a world saturated with synthetic fibers, natural textiles hold an organic tactile truth that softens, breathes, and gracefully matures alongside the wearer.",
      sections: [
        {
          heading: "The Breath of Handspun Yarn",
          body:
            "Unlike machine-spun synthetic polyester, handwoven silk contains subtle, poetic slubs and micro-variations. These are not imperfections—they are the indelible fingerprints of human touch.",
        },
        {
          heading: "Caring for Heirloom Textiles",
          body:
            "Handloom garments require mindful care: gentle steaming, breathable muslin cloth storage, and occasional airing in indirect sunlight. Cared for with love, they become treasured heirlooms for future generations.",
          quote: "A handwoven garment is a living tapestry that absorbs your life's memories.",
        },
      ],
    },
  },
]

export const JOURNAL_CATEGORIES = [
  "All",
  "Craft & Heritage",
  "Style Guide",
  "Brand Story",
  "Inspiration",
  "Fabric Spotlight",
] as const

export function getAllArticles(): JournalArticle[] {
  return JOURNAL_ARTICLES
}

export function getFeaturedArticle(): JournalArticle {
  return JOURNAL_ARTICLES.find((a) => a.featured) || JOURNAL_ARTICLES[0]
}

export function getArticleBySlug(slug: string): JournalArticle | undefined {
  return JOURNAL_ARTICLES.find((a) => a.slug === slug)
}

export function getRelatedArticles(currentSlug: string, limit = 3): JournalArticle[] {
  return JOURNAL_ARTICLES.filter((a) => a.slug !== currentSlug).slice(0, limit)
}
