import { Card, CardContent } from '@/components/ui/card';
import { Camera, Group, Percent, Smile } from 'lucide-react';

type Language = 'cn' | 'en' | 'no';

const translations = {
  cn: {
    feature1Title: '“邻居刚分享：小区门口水果店9点前进店8折”',
    feature1Desc: '轻松发现并分享您身边的实时优惠。',
    feature2Title: '拍照发布，1小时内就能团给10个邻居',
    feature2Desc: '看到好东西？拍张照就能快速发起团购。',
    feature3Title: '“5号楼李姐推荐的阿姨，我们楼3家都在用”',
    feature3Desc: '邻里间推荐可靠服务，生活更放心。',
    feature4Title: '“找3个同龄孩子一起请外教，在小区会所上课”',
    feature4Desc: '为孩子或自己组织兴趣班和活动，方便又实惠。',
  },
  en: {
    feature1Title: '"A neighbor just shared: 80% off at the fruit store at the community entrance before 9 a.m."',
    feature1Desc: 'Easily discover and share real-time deals around you.',
    feature2Title: 'Post a photo and form a group with 10 neighbors within an hour',
    feature2Desc: 'See something good? Just take a photo to quickly start a group buy.',
    feature3Title: '"The cleaner recommended by Sister Li in Building 5 is used by 3 families in our building"',
    feature3Desc: 'Recommend reliable services among neighbors for a more reassuring life.',
    feature4Title: '"Find 3 kids of the same age to hire a foreign teacher for classes at the community clubhouse"',
    feature4Desc: 'Organize interest classes and activities for your children or yourself, convenient and affordable.',
  },
  no: {
    feature1Title: '"En nabo delte nettopp: 80 % avslag i fruktbutikken ved inngangen til nabolaget før kl. 09.00"',
    feature1Desc: 'Oppdag og del enkelt sanntidstilbud rundt deg.',
    feature2Title: 'Legg ut et bilde og dann en gruppe med 10 naboer i løpet av en time',
    feature2Desc: 'Ser du noe bra? Bare ta et bilde for raskt å starte et gruppekjøp.',
    feature3Title: '"Vaskehjelpen anbefalt av søster Li i bygning 5, brukes av 3 familier i vår bygning"',
    feature3Desc: 'Anbefal pålitelige tjenester blant naboer for et mer betryggende liv.',
    feature4Title: '"Finn 3 barn på samme alder for å ansette en utenlandsk lærer for timer i samfunnshuset"',
    feature4Desc: 'Organiser interesseklasser og aktiviteter for barna dine eller deg selv, praktisk og rimelig.',
  },
};

const getFeatures = (t: typeof translations.cn) => [
  {
    icon: <Percent className="h-6 w-6 text-primary" />,
    title: t.feature1Title,
    description: t.feature1Desc,
  },
  {
    icon: <Camera className="h-6 w-6 text-primary" />,
    title: t.feature2Title,
    description: t.feature2Desc,
  },
  {
    icon: <Smile className="h-6 w-6 text-primary" />,
    title: t.feature3Title,
    description: t.feature3Desc,
  },
  {
    icon: <Group className="h-6 w-6 text-primary" />,
    title: t.feature4Title,
    description: t.feature4Desc,
  },
];

export function FeatureShowcase({ language = 'cn' }: { language?: Language }) {
  const t = translations[language];
  const features = getFeatures(t);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {features.map((feature, index) => (
        <Card
          key={index}
          className="transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-1 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
