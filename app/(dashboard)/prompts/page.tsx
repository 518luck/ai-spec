"use client";

import { Button } from "@/shared/ui/button";
import { useState } from "react";

export default function PromptsPage() {
  const [number, setNumber] = useState(0);

  return (
    <div>
      this is prompts page
      <Button onClick={() => setNumber(number + 1)}>button{number}</Button>
    </div>
  );
}
