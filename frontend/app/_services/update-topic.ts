import { topicService } from "@/app/_services/topic-service";

export async function updateTopic(topicId: number, topicName: string) {
  return topicService.updateTopic(topicId, topicName);
}
