"use client";

import { useRef } from "react";
import { useOrderWizard, type DeviceItem } from "./OrderWizardContext";
import { buildDeviceDisplayName } from "@/lib/device-catalog";

interface DeviceCatalogStepProps {
  device: DeviceItem;
  deviceIndex: number;
  isFinalized: boolean;
  orderStep: number;
  getWizardStep: (deviceId: string) => number;
}

function AdaptiveWizardCardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mb-2 flex h-56 w-full items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm md:h-64 lg:h-72">
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" loading="lazy" />
    </div>
  );
}

export default function DeviceCatalogStep({
  device,
  deviceIndex,
  isFinalized,
  orderStep,
  getWizardStep,
}: DeviceCatalogStepProps) {
  const context = useOrderWizard();
  const {
    updateDevice,
    wizardPanelRef,
    manualEntryByDevice,
    setManualEntryByDevice,
    manualEditOpenByDevice,
    setManualEditOpenByDevice,
    setWizardStepByDevice,
    setSelectedBrandByDevice,
    setSelectedSeriesByDevice,
    setSelectedModelByDevice,
    setSelectedVariantByDevice,
    customCatalogFormByDevice,
    setCustomCatalogFormByDevice,
    catalog,
    catalogCards,
    catalogLoaded,
    wizardTypeOptions,
    applyDeviceType,
    applyBrand,
    applySuggestedModel,
    addCustomModelToCatalog,
    getBrandsForDevice,
    getLinesForDevice,
    getModelsForDevice,
    getVariantsForModel,
    getTypeIdForDevice,
    getCardImage,
  } = context;

  const wizardStep = getWizardStep(device.id);

  const keepScrollPosition = (fn: () => void) => {
    if (typeof window === "undefined") {
      fn();
      return;
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const currentScrollY = window.scrollY;
    fn();
    const restore = () => {
      if (wizardPanelRef.current) wizardPanelRef.current.focus({ preventScroll: true });
      window.scrollTo({ top: currentScrollY, behavior: "auto" });
    };
    requestAnimationFrame(() => {
      restore();
      setTimeout(restore, 15);
      setTimeout(restore, 100);
    });
  };

  const wizardCardButtonClass =
    "group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/60 p-2 text-left shadow-[0_18px_35px_-28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-24px_rgba(15,23,42,0.14)] min-h-[320px]";
  const wizardCardInnerTextClass = "text-sm font-semibold text-slate-900";

  if (isFinalized || orderStep !== 2) return null;

  return (
    <>
      {!device.deviceModel || manualEditOpenByDevice[device.id] ? (
        <div
          ref={wizardPanelRef}
          tabIndex={-1}
          className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.22)]"
        >
          <h4 className="mb-3 text-sm font-semibold tracking-wide text-slate-700 uppercase">
            Asistente rapido
          </h4>
          {!manualEntryByDevice[device.id] && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => {
                  setManualEntryByDevice((prev) => ({ ...prev, [device.id]: true }));
                  setManualEditOpenByDevice((prev) => ({ ...prev, [device.id]: true }));
                  setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 6 }));
                  updateDevice(device.id, { deviceType: null, deviceModel: "" });
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                No encuentras el dispositivo? Escribelo manual
              </button>
            </div>
          )}

          {/* Step 1: Device Type */}
          {wizardStep === 1 && (
            <>
              <p className="mb-3 text-xl font-semibold text-slate-700">
                1) Que dispositivo vas a recibir?
              </p>
              {!catalogLoaded ? (
                <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Cargando catalogo de dispositivos...
                </div>
              ) : (
                <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {wizardTypeOptions.map((option) => (
                    <button
                      key={`${device.id}-${option.id}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyDeviceType(device.id, option.id)}
                      className={wizardCardButtonClass}
                    >
                      <AdaptiveWizardCardImage src={option.imageUrl} alt={option.label} />
                      <p className={wizardCardInnerTextClass}>
                        {option.icon} {option.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{option.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2: Brand */}
          {wizardStep === 2 && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xl font-semibold text-slate-700">
                  2) Que marca de{" "}
                  {wizardTypeOptions
                    .find((option) => option.id === device.deviceType)
                    ?.label.toLowerCase()}
                  ?
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-700 underline"
                  onClick={() =>
                    setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 1 }))
                  }
                >
                  Volver
                </button>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                {getBrandsForDevice(device).map((brand) => (
                  <button
                    key={`${device.id}-brand-${brand.id}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBrand(device.id, String(brand.id))}
                    className={wizardCardButtonClass}
                  >
                    <AdaptiveWizardCardImage
                      src={
                        brand.logo_url ||
                        "https://dummyimage.com/320x160/e2e8f0/475569&text=Marca"
                      }
                      alt={brand.name}
                    />
                    <p className="text-xs font-semibold">{brand.name}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 3: Series/Line */}
          {wizardStep === 3 && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xl font-semibold text-slate-700">
                  3) Selecciona serie / linea
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-700 underline"
                  onClick={() => {
                    keepScrollPosition(() => {
                      setSelectedBrandByDevice((prev) => ({
                        ...prev,
                        [device.id]: null,
                      }));
                      setSelectedSeriesByDevice((prev) => ({
                        ...prev,
                        [device.id]: null,
                      }));
                      setSelectedModelByDevice((prev) => ({
                        ...prev,
                        [device.id]: null,
                      }));
                      setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 2 }));
                    });
                  }}
                >
                  Volver
                </button>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                {getLinesForDevice(device).map((series) => (
                  <button
                    key={`${device.id}-series-${series.id}`}
                    type="button"
                    onClick={() => {
                      keepScrollPosition(() => {
                        setSelectedSeriesByDevice((prev) => ({
                          ...prev,
                          [device.id]: String(series.id),
                        }));
                        setSelectedModelByDevice((prev) => ({
                          ...prev,
                          [device.id]: null,
                        }));
                        setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 4 }));
                      });
                    }}
                    className={wizardCardButtonClass}
                  >
                    <AdaptiveWizardCardImage
                      src={
                        series.image_url ||
                        "https://dummyimage.com/320x520/e2e8f0/475569&text=L%C3%ADnea"
                      }
                      alt={series.name}
                    />
                    <p className="text-xs font-semibold">{series.name}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 4: Model */}
          {wizardStep === 4 && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xl font-semibold text-slate-700">4) Modelo exacto</p>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-700 underline"
                  onClick={() => {
                    keepScrollPosition(() => {
                      setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 3 }));
                    });
                  }}
                >
                  Volver
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {getModelsForDevice(device).map((model) => {
                  const typeId = getTypeIdForDevice(device);
                  const brandId = Number(context.selectedBrandByDevice[device.id]) || null;
                  const lineId = Number(context.selectedSeriesByDevice[device.id]) || null;
                  const displayName = buildDeviceDisplayName({
                    brandName:
                      catalog.brands.find(
                        (b) => b.id === Number(context.selectedBrandByDevice[device.id]),
                      )?.name ?? "",
                    lineName:
                      catalog.productLines.find(
                        (l) => l.id === Number(context.selectedSeriesByDevice[device.id]),
                      )?.name ?? "",
                    modelName: model.name,
                  });
                  const cardImage = getCardImage({
                    typeId,
                    brandId,
                    lineId,
                    modelId: model.id,
                    variantId: null,
                  });
                  return (
                    <button
                      key={`${device.id}-model-${model.id}`}
                      type="button"
                      onClick={() => {
                        const modelVariants = getVariantsForModel(model.id);
                        setSelectedModelByDevice((prev) => ({
                          ...prev,
                          [device.id]: String(model.id),
                        }));
                        setSelectedVariantByDevice((prev) => ({
                          ...prev,
                          [device.id]: null,
                        }));
                        if (modelVariants.length > 0) {
                          setWizardStepByDevice((prev) => ({
                            ...prev,
                            [device.id]: 5,
                          }));
                          return;
                        }
                        applySuggestedModel(device.id, displayName);
                      }}
                      className={wizardCardButtonClass}
                    >
                      <AdaptiveWizardCardImage
                        src={
                          cardImage ||
                          "https://dummyimage.com/320x160/e2e8f0/475569&text=Modelo"
                        }
                        alt={displayName}
                      />
                      <span>{displayName}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  No aparece? Agregalo al catalogo
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input
                    value={customCatalogFormByDevice[device.id]?.model ?? ""}
                    onChange={(e) =>
                      setCustomCatalogFormByDevice((prev) => ({
                        ...prev,
                        [device.id]: {
                          ...(prev[device.id] ?? { model: "", variant: "" }),
                          model: e.target.value,
                        },
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    placeholder="Modelo (ej: S24)"
                  />
                  <input
                    value={customCatalogFormByDevice[device.id]?.variant ?? ""}
                    onChange={(e) =>
                      setCustomCatalogFormByDevice((prev) => ({
                        ...prev,
                        [device.id]: {
                          ...(prev[device.id] ?? { model: "", variant: "" }),
                          variant: e.target.value,
                        },
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    placeholder="Variante (opcional)"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomModelToCatalog(device)}
                    className="rounded-lg bg-gradient-to-r from-slate-600 to-zinc-600 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
                  >
                    Guardar y usar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 5: Variant */}
          {wizardStep === 5 && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xl font-semibold text-slate-700">5) Variante</p>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-700 underline"
                  onClick={() =>
                    setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 4 }))
                  }
                >
                  Volver
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {(() => {
                  const selectedModelId = Number(context.selectedModelByDevice[device.id]);
                  if (!selectedModelId) return null;
                  const model = catalog.models.find((row) => row.id === selectedModelId);
                  if (!model) return null;
                  const variants = getVariantsForModel(selectedModelId);
                  const typeId = getTypeIdForDevice(device);
                  const brandId = Number(context.selectedBrandByDevice[device.id]) || null;
                  const lineId = Number(context.selectedSeriesByDevice[device.id]) || null;
                  const brandName =
                    catalog.brands.find(
                      (b) => b.id === Number(context.selectedBrandByDevice[device.id]),
                    )?.name ?? "";
                  const lineName =
                    catalog.productLines.find(
                      (l) => l.id === Number(context.selectedSeriesByDevice[device.id]),
                    )?.name ?? "";

                  return variants.map((variant) => {
                    const displayName = buildDeviceDisplayName({
                      brandName,
                      lineName,
                      modelName: model.name,
                      variantName: variant.name,
                    });
                    const cardImage = getCardImage({
                      typeId,
                      brandId,
                      lineId,
                      modelId: model.id,
                      variantId: variant.id,
                    });
                    return (
                      <button
                        key={`${device.id}-variant-${variant.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedVariantByDevice((prev) => ({
                            ...prev,
                            [device.id]: String(variant.id),
                          }));
                          applySuggestedModel(device.id, displayName);
                        }}
                        className={wizardCardButtonClass}
                      >
                        <AdaptiveWizardCardImage
                          src={
                            cardImage ||
                            "https://dummyimage.com/320x160/e2e8f0/475569&text=Variante"
                          }
                          alt={displayName}
                        />
                        <span>{variant.name}</span>
                      </button>
                    );
                  });
                })()}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-700 uppercase">
              Dispositivo seleccionado
            </p>
            <p className="text-sm font-semibold text-zinc-900">{device.deviceModel}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setManualEditOpenByDevice((prev) => ({ ...prev, [device.id]: true }))
            }
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Editar dispositivo
          </button>
        </div>
      )}
    </>
  );
}
