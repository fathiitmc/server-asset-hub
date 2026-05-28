"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "./submit-button";
import {
  createCredentialAction,
  deleteCredentialAction,
  revealCredentialAction,
  updateCredentialAction,
  type RevealCredentialState,
} from "@/app/assets/[id]/credentials/actions";
import type { CredentialSummary } from "@/src/lib/credentials/credentials";

type CredentialVaultProps = {
  assetId: string;
  credentials: CredentialSummary[];
};

export function CredentialVault({
  assetId,
  credentials,
}: CredentialVaultProps) {
  const revealAction = revealCredentialAction.bind(null, assetId);
  const [revealState, revealFormAction] = useActionState<
    RevealCredentialState,
    FormData
  >(revealAction, {});

  return (
    <section className="premium-panel rounded-2xl p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Credential vault
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Store encrypted access details linked to this asset.
          </p>
        </div>
        <span className="mt-2 inline-flex w-fit rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 sm:mt-0">
          AES encrypted
        </span>
      </div>

      <CreateCredentialForm assetId={assetId} />

      <div className="mt-5 space-y-3">
        {credentials.length > 0 ? (
          credentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              assetId={assetId}
              credential={credential}
              revealState={revealState}
              revealFormAction={revealFormAction}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 p-5 text-sm text-zinc-600">
            No credentials stored for this asset yet.
          </div>
        )}
      </div>
    </section>
  );
}

function CreateCredentialForm({ assetId }: { assetId: string }) {
  const createAction = createCredentialAction.bind(null, assetId);

  return (
    <form
      action={createAction}
      className="mt-5 grid gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Field name="label" label="Label" placeholder="SSH Root" required />
        <Field name="username" label="Username" placeholder="root" />
        <Field
          name="secret"
          label="Secret"
          type="password"
          placeholder="Paste secret"
          required
        />
      </div>
      <label className="block text-sm font-medium text-zinc-700">
        Notes
        <textarea
          name="notes"
          rows={2}
          placeholder="Optional operational context"
          className="premium-field mt-2 block w-full rounded-xl px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
        />
      </label>
      <div>
        <SubmitButton pendingLabel="Saving credential...">
          Add credential
        </SubmitButton>
      </div>
    </form>
  );
}

function CredentialCard({
  assetId,
  credential,
  revealState,
  revealFormAction,
}: {
  assetId: string;
  credential: CredentialSummary;
  revealState: RevealCredentialState;
  revealFormAction: (payload: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const revealed =
    revealState.credentialId === credential.id ? revealState.secret : undefined;
  const revealError =
    revealState.credentialId === credential.id ? revealState.error : undefined;
  const deleteAction = deleteCredentialAction.bind(
    null,
    assetId,
    credential.id,
  );

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/75 p-4 shadow-sm shadow-zinc-950/[0.03] transition hover:border-zinc-300 hover:bg-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-950">
              {credential.label}
            </h3>
            <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
              Credential
            </span>
          </div>
          {credential.username ? (
            <p className="mt-2 text-sm text-zinc-600">
              Username:{" "}
              <span className="font-medium text-zinc-900">
                {credential.username}
              </span>
            </p>
          ) : null}
          {credential.notes ? (
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              {credential.notes}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-500">
            Updated {new Date(credential.updatedAt).toLocaleString("en")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={revealFormAction}>
            <input type="hidden" name="credentialId" value={credential.id} />
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-300/80 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Reveal
            </button>
          </form>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-300/80 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <form action={deleteAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-3 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <code className="break-all text-sm text-zinc-800">
            {revealed ?? "**********"}
          </code>
          {revealed ? <CopyButton value={revealed} /> : null}
        </div>
        {revealError ? (
          <p className="mt-2 text-xs text-red-700">{revealError}</p>
        ) : null}
      </div>

      {editing ? (
        <EditCredentialForm assetId={assetId} credential={credential} />
      ) : null}
    </div>
  );
}

function EditCredentialForm({
  assetId,
  credential,
}: {
  assetId: string;
  credential: CredentialSummary;
}) {
  const updateAction = updateCredentialAction.bind(
    null,
    assetId,
    credential.id,
  );

  return (
    <form
      action={updateAction}
      className="mt-4 grid gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Field
          name="label"
          label="Label"
          defaultValue={credential.label}
          required
        />
        <Field
          name="username"
          label="Username"
          defaultValue={credential.username ?? ""}
        />
        <Field
          name="secret"
          label="New secret"
          type="password"
          placeholder="Leave blank to keep current"
        />
      </div>
      <label className="block text-sm font-medium text-zinc-700">
        Notes
        <textarea
          name="notes"
          rows={2}
          defaultValue={credential.notes ?? ""}
          className="premium-field mt-2 block w-full rounded-xl px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
        />
      </label>
      <div>
        <SubmitButton pendingLabel="Updating credential...">
          Update credential
        </SubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="premium-field mt-2 block h-10 w-full rounded-xl px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
      />
    </label>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-300/80 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
