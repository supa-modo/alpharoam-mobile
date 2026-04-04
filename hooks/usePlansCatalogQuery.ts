import { useEffect } from "react";
import { AppState } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { plansCatalogQueryOptions } from "../lib/plansQuery";

export function usePlansCatalogQuery() {
  const query = useQuery({ ...plansCatalogQueryOptions });

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void query.refetch();
    });
    return () => sub.remove();
  }, [query.refetch]);

  return query;
}
