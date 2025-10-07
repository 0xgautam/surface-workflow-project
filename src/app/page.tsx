import { OnboardingWrapper } from "~/components/onboarding/onboarding-wrapper";
import Header from "~/components/shared/header";

const MOCK_API_KEY = "proj_test_12345";

export default function Page() {
  return (
    <main>
      <Header title="Getting Started" />

      <div className="mt-8">
        <OnboardingWrapper apiKey={MOCK_API_KEY} />
      </div>
    </main>
  );
}
