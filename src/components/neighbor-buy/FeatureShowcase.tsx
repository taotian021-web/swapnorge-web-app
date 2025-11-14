import { Card, CardContent } from '@/components/ui/card';
import { Camera, Group, Percent, Smile } from 'lucide-react';

const features = [
  {
    icon: <Percent className="h-6 w-6 text-primary" />,
    title: '“邻居刚分享：小区门口水果店9点前进店8折”',
    description: '轻松发现并分享您身边的实时优惠。',
  },
  {
    icon: <Camera className="h-6 w-6 text-primary" />,
    title: '拍照发布，1小时内就能团给10个邻居',
    description: '看到好东西？拍张照就能快速发起团购。',
  },
  {
    icon: <Smile className="h-6 w-6 text-primary" />,
    title: '“5号楼李姐推荐的阿姨，我们楼3家都在用”',
    description: '邻里间推荐可靠服务，生活更放心。',
  },
  {
    icon: <Group className="h-6 w-6 text-primary" />,
    title: '“找3个同龄孩子一起请外教，在小区会所上课”',
    description: '为孩子或自己组织兴趣班和活动，方便又实惠。',
  },
];

export function FeatureShowcase() {
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
