import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getHumanPlusResearchStatus,
  loadHumanPlusResearchFrame,
} from "../integrations/humanplus/humanPlusResearchService";

export const humanPlusRouter = router({
  status: protectedProcedure.query(() => {
    return getHumanPlusResearchStatus();
  }),

  inspectFrame: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().min(1).max(200),
        relativeAnnotationPath: z.string().min(1).max(1000),
        frameIndex: z.number().int().min(0).max(10_000_000).default(0),
      }),
    )
    .query(async ({ input }) => {
      const result = await loadHumanPlusResearchFrame(input);

      return {
        ...result,
        readOnly: true as const,
        paidGenerationTriggered: false as const,
        productionMutationTriggered: false as const,
      };
    }),
});
