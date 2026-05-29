"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Asset } from "@/lib/assets";
import { SubmitButton } from "./submit-button";

type RegistryOption = {
  id: string;
  name: string;
  slug: string;
};

type AssetFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  asset?: Asset;
  submitLabel: string;
  canViewFinance?: boolean;
  options: {
    assetTypes: readonly string[];
    assetStatuses: readonly string[];
    assetEnvironments: readonly string[];
    assetRegions: readonly string[];
    billingCycles: readonly string[];
  };
  registries?: {
    providers: RegistryOption[];
    owners: RegistryOption[];
    tags: RegistryOption[];
    teams?: RegistryOption[];
  };
};

const inputClass =
  "premium-field mt-2 block w-full rounded-xl px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10";

export function AssetForm({
  action,
  asset,
  submitLabel,
  canViewFinance = true,
  options,
  registries = { providers: [], owners: [], tags: [], teams: [] },
}: AssetFormProps) {
  const selectedTags = new Set(asset?.tags ?? []);
  const [selectedType, setSelectedType] = useState(asset?.type ?? "");
  const typeProfile = useMemo(() => getTypeProfile(selectedType), [selectedType]);

  return (
    <form
      action={action}
      className="premium-panel rounded-2xl p-5"
    >
      <input
        type="hidden"
        name="lifecycleState"
        value={asset?.lifecycleState ?? "ACTIVE"}
      />
      <section>
        <div className="flex flex-col gap-1 border-b border-zinc-200/80 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Basic capture
          </p>
          <h2 className="text-base font-semibold text-zinc-950">
            Quick asset registration
          </h2>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Asset name" name="name" defaultValue={asset?.name} required />
          <Select
            label="Asset category / type"
            name="type"
            defaultValue={asset?.type ?? ""}
            required
            onChange={(event) => setSelectedType(event.currentTarget.value)}
          >
            <option value="" disabled>
              Select asset type
            </option>
            {options.assetTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <ComboboxField
            label="Provider"
            name="provider"
            defaultValue={asset?.provider}
            options={registries.providers}
            required
          />
          <ComboboxField
            label="Owner"
            name="owner"
            defaultValue={asset?.owner}
            options={registries.owners}
            required
          />
          <Select label="Status" name="status" defaultValue={asset?.status}>
            {options.assetStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {selectedType ? (
        <section className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700">
                {typeProfile.title}
              </p>
              <p className="text-xs text-zinc-500">{typeProfile.description}</p>
            </div>
            <span className="w-fit rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-200">
              Technical
            </span>
          </div>
          <TypeSpecificFields
            asset={asset}
            selectedType={selectedType}
            regionOptions={options.assetRegions}
          />
        </section>
      ) : null}

      <details className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
        <summary className="cursor-pointer list-none">
          <div className="inline-flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">
              Advanced information
            </span>
            <span className="text-xs text-zinc-500">
              Governance, FinOps, tags, notes, and descriptive metadata.
            </span>
          </div>
        </summary>
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-700">
                  Governance ownership
                </p>
                <p className="text-xs text-zinc-500">
                  Operational, financial, renewal, and escalation accountability.
                </p>
              </div>
              <span className="w-fit rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-200">
                Governance
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Select
                label="Environment"
                name="environment"
                defaultValue={asset?.environment ?? "PRODUCTION"}
              >
                {options.assetEnvironments.map((environment) => (
                  <option key={environment} value={environment}>
                    {environment}
                  </option>
                ))}
              </Select>
              <Select label="Assigned team" name="teamId" defaultValue={asset?.teamId ?? ""}>
                <option value="">Unassigned</option>
                {(registries.teams ?? []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
              <Field
                label="Operational owner"
                name="operationalOwner"
                defaultValue={asset?.operationalOwner}
              />
              <Field
                label="Finance owner"
                name="financeOwner"
                defaultValue={asset?.financeOwner}
              />
              <Field
                label="Renewal owner"
                name="renewalOwner"
                defaultValue={asset?.renewalOwner}
              />
              <Field
                label="Escalation owner"
                name="escalationOwner"
                defaultValue={asset?.escalationOwner}
              />
            </div>
          </div>

          {canViewFinance ? (
            <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-700">
                    FinOps pricing
                  </p>
                  <p className="text-xs text-zinc-500">
                    Billing metadata for spend visibility, renewals, and forecasting.
                  </p>
                </div>
                <span className="w-fit rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-200">
                  Financial
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Select
                  label="Billing cycle"
                  name="billingCycle"
                  defaultValue={asset?.billingCycle ?? "YEARLY"}
                >
                  {options.billingCycles.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle.replace("_", " ")}
                    </option>
                  ))}
                </Select>
                <Field
                  label="Monthly cost"
                  name="monthlyCost"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={(asset?.monthlyCost ?? 0).toString()}
                />
                <Field
                  label="Annual cost"
                  name="yearlyCost"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={(asset?.yearlyCost ?? asset?.estimatedCost ?? 0).toString()}
                />
                <Field
                  label="Estimated annual cost"
                  name="estimatedCost"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={asset?.estimatedCost.toString()}
                />
                <Field
                  label="One-time cost"
                  name="oneTimeCost"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={(asset?.oneTimeCost ?? 0).toString()}
                />
                <Field
                  label="Currency"
                  name="currency"
                  defaultValue={asset?.currency ?? "USD"}
                />
                <Field
                  label="Billing account"
                  name="billingAccount"
                  defaultValue={asset?.billingAccount}
                />
                <Field
                  label="Cost center"
                  name="costCenter"
                  defaultValue={asset?.costCenter}
                />
              </div>
              <label className="mt-4 block text-sm font-medium text-zinc-700">
                Cost notes
                <textarea
                  name="costNotes"
                  rows={3}
                  defaultValue={asset?.costNotes}
                  className={inputClass}
                />
              </label>
            </div>
          ) : (
            <HiddenFinanceFields asset={asset} />
          )}

          <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4">
            <p className="text-sm font-medium text-zinc-700">Classification</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {registries.tags.map((tag) => (
                <label
                  key={tag.id}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag.name}
                    defaultChecked={selectedTags.has(tag.name)}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-950"
                  />
                  {tag.name}
                </label>
              ))}
            </div>
            <input
              name="tags"
              defaultValue={(asset?.tags ?? [])
                .filter(
                  (tag) =>
                    !registries.tags.some((option) => option.name === tag),
                )
                .join(", ")}
              placeholder="Add custom tags, comma separated"
              className="premium-field mt-3 h-10 w-full rounded-xl px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            />
            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Description
              <textarea
                name="description"
                rows={4}
                defaultValue={asset?.description}
                className={inputClass}
              />
            </label>
          </div>
        </div>
      </details>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/assets"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300/80 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}


function getTypeProfile(type: string) {
  switch (type) {
    case "SERVER":
      return {
        title: "Server details",
        description: "Capture the operational identifiers needed to find and access a server.",
      };
    case "DOMAIN":
      return {
        title: "Domain details",
        description: "Capture registrar, DNS, and renewal metadata without server-only fields.",
      };
    case "VPS":
      return {
        title: "VPS details",
        description: "Capture host, plan, provider, and region for a virtual server.",
      };
    case "CLOUD":
      return {
        title: "Cloud details",
        description: "Capture provider, region, account, and cost context for cloud assets.",
      };
    default:
      return {
        title: `${type.replace("_", " ")} details`,
        description: "Add only the metadata that helps identify and operate this asset.",
      };
  }
}

function TypeSpecificFields({
  asset,
  selectedType,
  regionOptions,
}: {
  asset?: Asset;
  selectedType: string;
  regionOptions: readonly string[];
}) {
  const regionRegistryOptions = regionOptions.map((region) => ({
    id: region,
    name: region,
    slug: region,
  }));

  if (selectedType === "DOMAIN") {
    return (
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="Domain name" name="domain" defaultValue={asset?.domain} />
        <Field
          label="Expiry date"
          name="renewalDate"
          type="date"
          defaultValue={asset?.renewalDate}
        />
        <Field
          label="DNS provider"
          name="billingAccount"
          defaultValue={asset?.billingAccount}
        />
      </div>
    );
  }

  if (selectedType === "SERVER" || selectedType === "VPS") {
    return (
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="Hostname" name="domain" defaultValue={asset?.domain} />
        <Field label="Public IP" name="ipAddress" defaultValue={asset?.ipAddress} />
        <ComboboxField
          label="Region"
          name="region"
          defaultValue={asset?.region}
          options={regionRegistryOptions}
        />
        <Field
          label={selectedType === "VPS" ? "Plan" : "Instance type"}
          name="purpose"
          defaultValue={asset?.purpose}
        />
        <Field
          label="Renewal date"
          name="renewalDate"
          type="date"
          defaultValue={asset?.renewalDate}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <ComboboxField
        label="Region"
        name="region"
        defaultValue={asset?.region}
        options={regionRegistryOptions}
      />
      <Field label="Domain / URL" name="domain" defaultValue={asset?.domain} />
      <Field label="IP address" name="ipAddress" defaultValue={asset?.ipAddress} />
      <Field
        label="Renewal date"
        name="renewalDate"
        type="date"
        defaultValue={asset?.renewalDate}
      />
      <Field label="Purpose" name="purpose" defaultValue={asset?.purpose} />
    </div>
  );
}

function ComboboxField({
  label,
  name,
  defaultValue,
  options,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: RegistryOption[];
  required?: boolean;
}) {
  const listId = `${name}-options`;

  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        list={listId}
        className={inputClass}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.id} value={option.name} />
        ))}
      </datalist>
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        min={min}
        className={inputClass}
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  children,
  required,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
  required?: boolean;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={onChange}
        className={inputClass}
      >
        {children}
      </select>
    </label>
  );
}

function HiddenFinanceFields({
  asset,
  compact = false,
}: {
  asset?: Asset;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <>
        <input
          type="hidden"
          name="estimatedCost"
          value={asset?.estimatedCost ?? 0}
        />
        <input type="hidden" name="currency" value={asset?.currency ?? "USD"} />
      </>
    );
  }

  return (
    <>
      <input
        type="hidden"
        name="billingCycle"
        value={asset?.billingCycle ?? "YEARLY"}
      />
      <input type="hidden" name="monthlyCost" value={asset?.monthlyCost ?? 0} />
      <input
        type="hidden"
        name="yearlyCost"
        value={asset?.yearlyCost ?? asset?.estimatedCost ?? 0}
      />
      <input type="hidden" name="oneTimeCost" value={asset?.oneTimeCost ?? 0} />
      <input
        type="hidden"
        name="billingAccount"
        value={asset?.billingAccount ?? ""}
      />
      <input type="hidden" name="costCenter" value={asset?.costCenter ?? ""} />
      <input type="hidden" name="costNotes" value={asset?.costNotes ?? ""} />
    </>
  );
}
