import { Card, CardContent } from '@/components/ui/card';
import { Camera, Group, Percent, Smile } from 'lucide-react';
import { getTranslations, type Language } from '@/lib/translations';

const getFeatures = (t: ReturnType<typeof getTranslations>['featureShowcase']) => [
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
  const t = getTranslations(language);
  const features = getFeatures(t.featureShowcase);

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
