import CustomizableLoginPage from '@/components/auth/CustomizableLoginPage';
import { cookies } from 'next/headers';
import { translateText, Language } from '@/lib/translation';

export default async function LoginPage() {
  // Determine target language from cookie; fallback to 'en'
  const cookieStore = await cookies();
  const lang = (cookieStore.get('app-language')?.value as Language) || 'en';

  if (lang !== 'pt') {
    return <CustomizableLoginPage />;
  }

  // SSR-translate critical login strings for zero flicker in PT
  const [welcomeMessage, welcomeSubtitle, usernameLabel, usernamePlaceholder, passwordLabel, passwordPlaceholder, signIn, forgotPassword] = await Promise.all([
    translateText('Welcome back', 'pt'),
    translateText('Sign in to your account', 'pt'),
    translateText('Username', 'pt'),
    translateText('Enter your username', 'pt'),
    translateText('Password', 'pt'),
    translateText('Enter your password', 'pt'),
    translateText('Sign In', 'pt'),
    translateText('Forgot your password?', 'pt'),
  ]);

  const i18n = {
    welcomeMessage,
    welcomeSubtitle,
    usernameLabel,
    usernamePlaceholder,
    passwordLabel,
    passwordPlaceholder,
    signIn,
    forgotPassword,
  };

  return <CustomizableLoginPage i18n={i18n} />;
}