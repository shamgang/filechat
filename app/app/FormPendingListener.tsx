'use client'

import { useEffect } from "react";
import { useFormStatus } from "react-dom";

export default function FormPendingListener({ setPending }: { setPending: (pending: boolean) => void }) {
  const { pending } = useFormStatus();

  useEffect(() => {
    setPending(pending);
  }, [pending, setPending]);

  return (<></>);
};