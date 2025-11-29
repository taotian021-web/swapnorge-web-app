'use client';
import { Header } from '@/components/neighbor-buy/Header';
import { getTranslations, type Language } from '@/lib/translations';
import { useSearchParams } from 'next/navigation';
import { Map as MapIcon } from 'lucide-react';

export default function MapPage() {
    const searchParams = useSearchParams();
    const lang = (searchParams.get('lang') || 'cn') as Language;
    const t = getTranslations(lang);

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex flex-1 flex-col items-center justify-center bg-muted/30 text-center">
                <MapIcon className="h-16 w-16 text-muted-foreground" />
                <h1 className="mt-4 text-2xl font-bold">
                    {t.footerNav.map}
                </h1>
                <p className="mt-2 text-muted-foreground">"邻里雷达" 地图视图正在开发中...</p>
            </main>
        </div>
    );
}
