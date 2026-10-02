
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  MapPin,
  Pencil,
  Trash2,
  Check,
  X,
  Ban,
  Star,
  Upload,
  Eye,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

type PlaceStatus = "pending" | "published" | "rejected" | "suspended";

type RelaxationPlace = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  status: PlaceStatus;
  rejection_reason: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

const STATUS_LABELS: Record<PlaceStatus, string> = {
  pending: "Pendente",
  published: "Publicado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

export default function AdminRelaxationPlaces() {
  const supabase = createClient();

  const [places, setPlaces] = useState<RelaxationPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlaceStatus>(
    "all"
  );

  const [showModal, setShowModal] = useState(false);
  const [editingPlace, setEditingPlace] =
    useState<RelaxationPlace | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingPlace, setRejectingPlace] =
    useState<RelaxationPlace | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    province: "",
    city: "",
    address: "",
    phone: "",
    image_url: "",
    status: "pending" as PlaceStatus,
    is_featured: false,
  });

  /* =========================================================
     CARREGAR LOCAIS
  ========================================================= */

  const loadPlaces = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("relaxation_places")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPlaces((data || []) as RelaxationPlace[]);
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  /* =========================================================
     FORM
  ========================================================= */

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "",
      province: "",
      city: "",
      address: "",
      phone: "",
      image_url: "",
      status: "pending",
      is_featured: false,
    });

    setEditingPlace(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (place: RelaxationPlace) => {
    setEditingPlace(place);

    setForm({
      name: place.name || "",
      description: place.description || "",
      category: place.category || "",
      province: place.province || "",
      city: place.city || "",
      address: place.address || "",
      phone: place.phone || "",
      image_url: place.image_url || "",
      status: place.status,
      is_featured: place.is_featured,
    });

    setShowModal(true);
  };

  /* =========================================================
     GUARDAR
  ========================================================= */

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Informe o nome do local.");
      return;
    }

    try {
      setSaving(true);

      if (editingPlace) {
        const { error } = await supabase
          .from("relaxation_places")
          .update({
            name: form.name.trim(),
            description: form.description.trim() || null,
            category: form.category.trim() || null,
            province: form.province.trim() || null,
            city: form.city.trim() || null,
            address: form.address.trim() || null,
            phone: form.phone.trim() || null,
            image_url: form.image_url.trim() || null,
            status: form.status,
            is_featured: form.is_featured,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPlace.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("relaxation_places")
          .insert({
            name: form.name.trim(),
            description: form.description.trim() || null,
            category: form.category.trim() || null,
            province: form.province.trim() || null,
            city: form.city.trim() || null,
            address: form.address.trim() || null,
            phone: form.phone.trim() || null,
            image_url: form.image_url.trim() || null,
            status: form.status,
            is_featured: form.is_featured,
          });

        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      await loadPlaces();
    } catch (error) {
      console.error("Erro ao guardar local:", error);
      alert("Não foi possível guardar o local.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     APROVAR
  ========================================================= */

  const approvePlace = async (place: RelaxationPlace) => {
    try {
      const { error } = await supabase
        .from("relaxation_places")
        .update({
          status: "published",
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", place.id);

      if (error) throw error;

      await loadPlaces();
    } catch (error) {
      console.error(error);
      alert("Não foi possível aprovar o local.");
    }
  };

  /* =========================================================
     REJEITAR
  ========================================================= */

  const openRejectModal = (place: RelaxationPlace) => {
    setRejectingPlace(place);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const rejectPlace = async () => {
    if (!rejectingPlace) return;

    if (!rejectionReason.trim()) {
      alert("Informe o motivo da rejeição.");
      return;
    }

    try {
      const { error } = await supabase
        .from("relaxation_places")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rejectingPlace.id);

      if (error) throw error;

      setShowRejectModal(false);
      setRejectingPlace(null);
      setRejectionReason("");

      await loadPlaces();
    } catch (error) {
      console.error(error);
      alert("Não foi possível rejeitar o local.");
    }
  };

  /* =========================================================
     SUSPENDER
  ========================================================= */

  const suspendPlace = async (place: RelaxationPlace) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja suspender "${place.name}"?`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("relaxation_places")
        .update({
          status: "suspended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", place.id);

      if (error) throw error;

      await loadPlaces();
    } catch (error) {
      console.error(error);
      alert("Não foi possível suspender o local.");
    }
  };

  /* =========================================================
     RESTAURAR
  ========================================================= */

  const restorePlace = async (place: RelaxationPlace) => {
    try {
      const { error } = await supabase
        .from("relaxation_places")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", place.id);

      if (error) throw error;

      await loadPlaces();
    } catch (error) {
      console.error(error);
      alert("Não foi possível restaurar o local.");
    }
  };

  /* =========================================================
     DESTACAR
  ========================================================= */

  const toggleFeatured = async (place: RelaxationPlace) => {
    try {
      const { error } = await supabase
        .from("relaxation_places")
        .update({
          is_featured: !place.is_featured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", place.id);

      if (error) throw error;

      await loadPlaces();
    } catch (error) {
      console.error(error);
      alert("Não foi possível alterar o destaque.");
    }
  };

  /* =========================================================
     ELIMINAR
  ========================================================= */

  const deletePlace = async (place: RelaxationPlace) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja eliminar "${place.name}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("relaxation_places")
        .delete()
        .eq("id", place.id);

      if (error) throw error;

      await loadPlaces();
    } catch (error) {
      console.error(error);
      alert("Não foi possível eliminar o local.");
    }
  };

  /* =========================================================
     FILTROS
  ========================================================= */

  const filteredPlaces = places.filter((place) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      place.name?.toLowerCase().includes(searchText) ||
      place.city?.toLowerCase().includes(searchText) ||
      place.province?.toLowerCase().includes(searchText) ||
      place.category?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "all" || place.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const countByStatus = (status: PlaceStatus) =>
    places.filter((place) => place.status === status).length;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-bold">
              Locais para Relaxar
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie locais de lazer, descanso e experiências de relaxamento.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo local
        </button>
      </div>

      {/* ESTATÍSTICAS */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total"
          value={places.length}
        />

        <StatCard
          label="Pendentes"
          value={countByStatus("pending")}
        />

        <StatCard
          label="Publicados"
          value={countByStatus("published")}
        />

        <StatCard
          label="Suspensos"
          value={countByStatus("suspended")}
        />
      </div>

      {/* FILTROS */}

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar local..."
            className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | PlaceStatus)
          }
          className="rounded-lg border bg-background px-3 py-2.5 text-sm"
        >
          <option value="all">Todos os estados</option>
          <option value="pending">Pendentes</option>
          <option value="published">Publicados</option>
          <option value="rejected">Rejeitados</option>
          <option value="suspended">Suspensos</option>
        </select>

        <button
          onClick={loadPlaces}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* LISTA */}

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="mb-3 h-10 w-10 text-muted-foreground" />

            <h3 className="font-semibold">
              Nenhum local encontrado
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Crie o primeiro local para começar.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="p-4 transition hover:bg-muted/30"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  {/* IMAGEM */}

                  <div className="h-24 w-full shrink-0 overflow-hidden rounded-lg bg-muted lg:w-32">
                    {place.image_url ? (
                      <img
                        src={place.image_url}
                        alt={place.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* INFORMAÇÕES */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {place.name}
                      </h3>

                      {place.is_featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          <Star className="h-3 w-3 fill-current" />
                          Destaque
                        </span>
                      )}

                      <StatusBadge status={place.status} />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {place.category && (
                        <span>{place.category}</span>
                      )}

                      {(place.city || place.province) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />

                          {[place.city, place.province]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </div>

                    {place.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {place.description}
                      </p>
                    )}

                    {place.status === "rejected" &&
                      place.rejection_reason && (
                        <p className="mt-2 text-sm text-red-600">
                          <strong>Motivo:</strong>{" "}
                          {place.rejection_reason}
                        </p>
                      )}
                  </div>

                  {/* AÇÕES */}

                  <div className="flex flex-wrap items-center gap-2">
                    {place.status === "pending" && (
                      <>
                        <button
                          onClick={() => approvePlace(place)}
                          title="Aprovar"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                          Aprovar
                        </button>

                        <button
                          onClick={() => openRejectModal(place)}
                          title="Rejeitar"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                          Rejeitar
                        </button>
                      </>
                    )}

                    {place.status === "published" && (
                      <>
                        <button
                          onClick={() => toggleFeatured(place)}
                          title={
                            place.is_featured
                              ? "Remover destaque"
                              : "Destacar"
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
                            place.is_featured
                              ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              place.is_featured
                                ? "fill-current"
                                : ""
                            }`}
                          />
                          {place.is_featured
                            ? "Destacado"
                            : "Destacar"}
                        </button>

                        <button
                          onClick={() => suspendPlace(place)}
                          title="Suspender"
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted"
                        >
                          <Ban className="h-4 w-4" />
                          Suspender
                        </button>
                      </>
                    )}

                    {place.status === "suspended" && (
                      <button
                        onClick={() => restorePlace(place)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        Restaurar
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(place)}
                      title="Editar"
                      className="rounded-lg border p-2 hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => deletePlace(place)}
                      title="Eliminar"
                      className="rounded-lg border p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          MODAL CRIAR / EDITAR
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingPlace
                    ? "Editar local"
                    : "Novo local"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  Preencha os dados do local.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <FormField label="Nome do local *">
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ex.: Resort dos Mangais"
                  className="input-admin"
                />
              </FormField>

              <FormField label="Descrição">
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Descreva o local..."
                  className="input-admin resize-none"
                />
              </FormField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Categoria">
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                    placeholder="Ex.: Resort, Praia, Spa..."
                    className="input-admin"
                  />
                </FormField>

                <FormField label="Telefone">
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+244 ..."
                    className="input-admin"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Província">
                  <input
                    value={form.province}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        province: e.target.value,
                      })
                    }
                    placeholder="Ex.: Luanda"
                    className="input-admin"
                  />
                </FormField>

                <FormField label="Cidade / Município">
                  <input
                    value={form.city}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        city: e.target.value,
                      })
                    }
                    placeholder="Ex.: Talatona"
                    className="input-admin"
                  />
                </FormField>
              </div>

              <FormField label="Endereço">
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
                  }
                  placeholder="Endereço completo"
                  className="input-admin"
                />
              </FormField>

              <FormField label="URL da imagem principal">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Upload className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      value={form.image_url}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          image_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="input-admin pl-9"
                    />
                  </div>
                </div>
              </FormField>

              {form.image_url && (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={form.image_url}
                    alt="Pré-visualização"
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Estado">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as PlaceStatus,
                      })
                    }
                    className="input-admin"
                  >
                    <option value="pending">
                      Pendente
                    </option>
                    <option value="published">
                      Publicado
                    </option>
                    <option value="rejected">
                      Rejeitado
                    </option>
                    <option value="suspended">
                      Suspenso
                    </option>
                  </select>
                </FormField>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        is_featured: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      Destacar local
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Dar maior destaque na plataforma.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? "A guardar..."
                  : editingPlace
                    ? "Guardar alterações"
                    : "Criar local"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL REJEIÇÃO
      ===================================================== */}

      {showRejectModal && rejectingPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background shadow-xl">
            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">
                Rejeitar local
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Informe o motivo pelo qual{" "}
                <strong>{rejectingPlace.name}</strong>{" "}
                está a ser rejeitado.
              </p>
            </div>

            <div className="p-5">
              <textarea
                value={rejectionReason}
                onChange={(e) =>
                  setRejectionReason(e.target.value)
                }
                rows={5}
                placeholder="Motivo da rejeição..."
                className="input-admin resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <button
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </button>

              <button
                onClick={rejectPlace}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Rejeitar local
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS LOCAIS */}

      <style jsx>{`
        .input-admin {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input-admin:focus {
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.25);
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: PlaceStatus;
}) {
  const styles: Record<PlaceStatus, string> = {
    pending:
      "bg-yellow-100 text-yellow-700",
    published:
      "bg-green-100 text-green-700",
    rejected:
      "bg-red-100 text-red-700",
    suspended:
      "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
      </label>

      {children}
    </div>
  );
}
