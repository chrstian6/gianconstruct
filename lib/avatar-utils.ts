const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const avatarUtils = {
  getAvatarUrl: (avatarPath: string) => {
    if (!avatarPath) return "";
    if (avatarPath.startsWith("http")) return avatarPath;
    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`;
  },

  predefinedAvatars: Array.from({ length: 13 }, (_, i) => {
    const avatarNumber = i + 1;
    return {
      id: `avatar-${avatarNumber}`,
      path: `predefined/avatar${avatarNumber}.png`,
      label: `Avatar ${avatarNumber}`,
      url: `${SUPABASE_URL}/storage/v1/object/public/avatars/predefined/avatar${avatarNumber}.png`,
    };
  }),

  getRandomAvatar: () => {
    const randomIndex = Math.floor(Math.random() * 13);
    return avatarUtils.predefinedAvatars[randomIndex].url;
  },
};
