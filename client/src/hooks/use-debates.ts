import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertDebate } from "@shared/schema";

export function useDebates() {
  return useQuery({
    queryKey: [api.debates.list.path],
    queryFn: async () => {
      const res = await fetch(api.debates.list.path);
      if (!res.ok) throw new Error("Failed to fetch debates");
      return api.debates.list.responses[200].parse(await res.json());
    },
  });
}

export function useDebate(id: number) {
  return useQuery({
    queryKey: [api.debates.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.debates.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch debate");
      return api.debates.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateDebate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertDebate) => {
      const res = await fetch(api.debates.create.path, {
        method: api.debates.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.debates.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create debate");
      }
      
      return api.debates.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debates.list.path] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const url = buildUrl(api.debates.addMessage.path, { id });
      const res = await fetch(url, {
        method: api.debates.addMessage.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
         if (res.status === 404) {
             throw new Error("Debate not found");
         }
        throw new Error("Failed to send message");
      }

      return api.debates.addMessage.responses[201].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.debates.get.path, id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
