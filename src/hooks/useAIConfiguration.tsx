import { useRouter } from "@/lib/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export const useAIConfiguration = () => {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();

  const checkConfiguration = async () => {
    const currentUser = user || await fetchMe().catch(() => null);

    if (!currentUser) {
      toast.error(
        <>
          <span>{"AI \u529f\u80fd\u9700\u8981\u767b\u5f55\u540e\u4f7f\u7528"}</span>
          <Button
            variant="link"
            className="p-0 h-auto ml-1 font-bold underline decoration-[#D97757]/30 underline-offset-4 text-[#D97757]"
            onClick={() => router.push("/app/dashboard/auth")}
          >
            {"\u53bb\u767b\u5f55"}
          </Button>
        </>
      );
      return false;
    }

    return true;
  };

  return {
    checkConfiguration,
  };
};
