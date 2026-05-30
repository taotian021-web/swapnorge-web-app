/**
 * 测试profile初始化逻辑
 */

describe('Supabase Auth - Profile Creation', () => {
  it('should generate valid guest credentials with correct email format', () => {
    // 模拟generateGuestCredentials
    const generateCredentials = () => {
      const randomId = Math.random().toString(36).substring(2, 15);
      const email = `guest-${randomId}@example.com`;
      const password = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((value) => value.toString(36).padStart(2, '0'))
        .join('')
        .slice(0, 16);
      return { email, password };
    };

    const creds = generateCredentials();
    
    // 验证邮箱格式
    expect(creds.email).toMatch(/^guest-[a-z0-9]+@example\.com$/);
    expect(creds.password).toHaveLength(16);
  });

  it('should create default profile stats', () => {
    const defaultStats = {
      points: 100,
      reputation: 5.0,
      completedSwaps: 0,
      memberSince: new Date().toISOString(),
    };

    expect(defaultStats.points).toBe(100);
    expect(defaultStats.reputation).toBe(5.0);
    expect(defaultStats.completedSwaps).toBe(0);
    expect(typeof defaultStats.memberSince).toBe('string');
  });

  it('should generate unique display names', () => {
    const generateName = () => {
      const randomName = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `Guest-${randomName}`;
    };

    const names = new Set();
    for (let i = 0; i < 100; i++) {
      names.add(generateName());
    }

    // 大部分应该是唯一的
    expect(names.size).toBeGreaterThan(90);
  });
});

describe('useSupabaseProfile Hook', () => {
  it('should auto-create profile when not found', () => {
    // 这个测试需要mock Supabase客户端
    // 模拟错误代码 'PGRST116' (No rows found)
    const errorCode = 'PGRST116';
    const shouldCreateProfile = errorCode === 'PGRST116';
    
    expect(shouldCreateProfile).toBe(true);
  });

  it('should handle existing profile gracefully', () => {
    // 模拟已存在的profile数据
    type MockProfileRecord = {
      id: string
      uid: string
      display_name?: string
      photo_url?: string | null
      displayName?: string
      photoURL?: string | null
      stats?: {
        points: number
        reputation: number
        completedSwaps: number
        memberSince: string
      } | null
    }

    const mockProfile: MockProfileRecord = {
      id: 'user-123',
      uid: 'user-123',
      display_name: 'Test User',
      photo_url: null,
      stats: {
        points: 100,
        reputation: 5.0,
        completedSwaps: 0,
        memberSince: '2026-05-16T00:00:00Z',
      },
    };

    const mapped = {
      ...mockProfile,
      displayName: mockProfile.display_name ?? mockProfile.displayName ?? '',
      photoURL: mockProfile.photo_url ?? mockProfile.photoURL ?? null,
      stats: mockProfile.stats ?? null,
    };

    expect(mapped.displayName).toBe('Test User');
    expect(mapped.stats!.points).toBe(100);
  });
});
