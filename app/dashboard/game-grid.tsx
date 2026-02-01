/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox"; // ADDED
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Gamepad2,
  Search,
  X,
  CalendarIcon,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- Types ---

interface Game {
  id: string;
  name: string | null;
  description: string | null;
  genre: string | null;
  imageUrl: string | null;
  gameUrl: string | null;
  isActive: boolean;
  rating?: string | number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Permission {
  key: string;
}

interface UserRole {
  name: string;
  permissions: Permission[];
}

interface User {
  id: string;
  name: string;
  userRole: UserRole;
}

// Available genres
const GENRES = [
  "Action",
  "Adventure",
  "Racing",
  "Puzzle",
  "Strategy",
  "Sports",
  "RPG",
  "Simulation",
  "Horror",
  "Arcade",
  "Survival_horror",
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date Created" },
  { value: "name", label: "Name" },
  { value: "rating", label: "Rating" },
];

// --- Helpers ---

const hasPermission = (user: User | null, permissionKey: string): boolean => {
  if (!user?.userRole?.permissions) return false;
  return user.userRole.permissions.some(
    (permission) => permission.key === permissionKey,
  );
};

const getPaginationRange = (current: number, total: number, delta = 2) => {
  const range: (number | "ellipsis")[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push("ellipsis");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("ellipsis");
  if (total > 1) range.push(total);
  return range;
};

// --- Edit Dialog ---

function EditGameDialog({ game, open, onOpenChange, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "",
    imageUrl: "",
    gameUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || "",
        description: game.description || "",
        genre: game.genre,
        imageUrl: game.imageUrl || "",
        gameUrl: game.gameUrl || "",
      });
    }
  }, [game]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game) return;
    setIsSaving(true);
    try {
      await api.patch(`/api/game/update/${game.id}`, { data: formData });
      toast.success("Game updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update game");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={key} className="text-right capitalize">
                {key}
              </Label>
              <Input
                id={key}
                className="col-span-3"
                value={value}
                onChange={(e) =>
                  setFormData({ ...formData, [key]: e.target.value })
                }
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Grid Component ---

export default function GameGrid({ user }: { user: User }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pagination state
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Dialog states
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  // Permissions
  const canUpdateGame = hasPermission(user, "game.update");
  const canDeleteGame = hasPermission(user, "game.delete");
  const canToggleStatus = hasPermission(user, "game.update");
  const canManageGames = canUpdateGame || canDeleteGame || canToggleStatus;
  const canBulkManage = canUpdateGame || canDeleteGame; // Use specific permissions for bulk

  // Bulk selection
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);

  // --- Initialize filters from URL on mount ---
  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    const searchFromUrl = searchParams.get("search") || "";
    const genreFromUrl = searchParams.get("genre") || "all";
    const statusFromUrl = searchParams.get("status") || "all";
    const sortByFromUrl = searchParams.get("sortBy") || "createdAt";
    const sortOrderFromUrl = (searchParams.get("sortOrder") || "DESC") as
      | "ASC"
      | "DESC";
    const dateFromStr = searchParams.get("dateFrom");
    const dateToStr = searchParams.get("dateTo");

    setPage(pageFromUrl);
    setSearch(searchFromUrl);
    setDebouncedSearch(searchFromUrl);
    setGenre(genreFromUrl);
    setStatus(statusFromUrl);
    setSortBy(sortByFromUrl);
    setSortOrder(sortOrderFromUrl);

    if (dateFromStr) setDateFrom(new Date(dateFromStr));
    if (dateToStr) setDateTo(new Date(dateToStr));

    fetchGames(
      pageFromUrl,
      searchFromUrl,
      genreFromUrl,
      statusFromUrl,
      sortByFromUrl,
      sortOrderFromUrl,
      dateFromStr ? new Date(dateFromStr) : undefined,
      dateToStr ? new Date(dateToStr) : undefined,
    );
  }, []);

  // --- Debounce search input ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // --- When debounced search changes, trigger fetch ---
  useEffect(() => {
    if (debouncedSearch !== searchParams.get("search")) {
      handleFilterChange();
    }
  }, [debouncedSearch]);

  // --- Build query string from filters ---
  const buildQueryString = useCallback(
    (
      pageNum: number,
      searchTerm: string,
      genreFilter: string,
      statusFilter: string,
      sort: string,
      order: string,
      startDate?: Date,
      endDate?: Date,
    ) => {
      const params = new URLSearchParams();
      params.set("page", pageNum.toString());
      params.set("limit", "12");

      if (searchTerm) params.set("search", searchTerm);
      if (genreFilter && genreFilter !== "all")
        params.set("genre", genreFilter);
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      if (sort) params.set("sortBy", sort);
      if (order) params.set("sortOrder", order);
      if (startDate)
        params.set("dateFrom", startDate.toISOString().split("T")[0]);
      if (endDate) params.set("dateTo", endDate.toISOString().split("T")[0]);

      return params.toString();
    },
    [],
  );

  // --- Fetch games with all filters ---
  const fetchGames = async (
    pageNumber = page,
    searchTerm = debouncedSearch,
    genreFilter = genre,
    statusFilter = status,
    sort = sortBy,
    order = sortOrder,
    startDate = dateFrom,
    endDate = dateTo,
    silent = false,
  ) => {
    if (!silent) setLoading(true);

    try {
      const queryString = buildQueryString(
        pageNumber,
        searchTerm,
        genreFilter,
        statusFilter,
        sort,
        order,
        startDate,
        endDate,
      );

      const res = await api.get(`/api/game/showallgames?${queryString}`);

      // --- FIX: Updated to map API structure { success, message, meta, games } ---
      setGames(res.data.data.games);
      console.log(res)

      if (res.data.data.page) {
        const { total, limit, page: currentPage } = res.data.data.page;
        setTotalPages(Math.ceil(total / limit));
        setPage(currentPage);
      } else {
        setTotalPages(1);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch games");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- Update URL and fetch when filters change ---
  const handleFilterChange = useCallback(() => {
    const queryString = buildQueryString(
      1,
      debouncedSearch,
      genre,
      status,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
    );

    router.push(`?${queryString}`, { scroll: false });
    fetchGames(
      1,
      debouncedSearch,
      genre,
      status,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
    );
  }, [debouncedSearch, genre, status, sortBy, sortOrder, dateFrom, dateTo]);

  // --- Handle filter changes (except search which is debounced) ---
  useEffect(() => {
    if (
      genre !== "all" ||
      status !== "all" ||
      sortBy !== "createdAt" ||
      sortOrder !== "DESC" ||
      dateFrom ||
      dateTo
    ) {
      handleFilterChange();
    }
  }, [genre, status, sortBy, sortOrder, dateFrom, dateTo]);

  // --- Clear all filters ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setGenre("all");
    setStatus("all");
    setSortBy("createdAt");
    setSortOrder("DESC");
    setDateFrom(undefined);
    setDateTo(undefined);

    router.push("?page=1&limit=12", { scroll: false });
    fetchGames(1, "", "all", "all", "createdAt", "DESC", undefined, undefined);
  };

  // --- Check if any filters are active ---
  const hasActiveFilters =
    search ||
    genre !== "all" ||
    status !== "all" ||
    sortBy !== "createdAt" ||
    sortOrder !== "DESC" ||
    dateFrom ||
    dateTo;

  // --- Pagination ---
  const goToPage = (p: number) => {
    const queryString = buildQueryString(
      p,
      debouncedSearch,
      genre,
      status,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
    );

    router.push(`?${queryString}`, { scroll: false });
    fetchGames(
      p,
      debouncedSearch,
      genre,
      status,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
    );
  };

  // --- Auto-refresh (optional) ---
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGames(
        page,
        debouncedSearch,
        genre,
        status,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        true,
      );
    }, 30000);
    return () => clearInterval(interval);
  }, [
    page,
    debouncedSearch,
    genre,
    status,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
  ]);

  // --- Toggle game status ---
  const toggleGameStatus = async (gameId: string, currentState: boolean) => {
    if (!canToggleStatus) {
      toast.error("You don't have permission to change game status");
      return;
    }

    const nextState = !currentState;

    // Optimistic update
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, isActive: nextState } : g)),
    );

    try {
      await api.patch(`/api/game/update/${gameId}`, {
        data: {
          isActive: nextState,
        },
      });

      toast.success("Game status updated");
    } catch (error: any) {
      // Rollback on failure
      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId ? { ...g, isActive: currentState } : g,
        ),
      );

      toast.error(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to update status",
      );
    }
  };

  const handleEdit = (game: Game) => {
    if (!canUpdateGame) return;
    setEditingGame(game);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (game: Game) => {
    if (!canDeleteGame) return;
    setGameToDelete(game);
  };

  // --- Bulk Selection Logic ---

  const toggleSelectGame = (gameId: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedGameIds.length === games.length) {
      setSelectedGameIds([]);
    } else {
      setSelectedGameIds(games.map((g) => g.id));
    }
  };

  const bulkUpdateStatus = async (isActive: boolean) => {
    try {
      await api.patch("/api/game/bulk-status", {
        gameIds: selectedGameIds,
        isActive,
      });

      toast.success("Games updated successfully");
      setSelectedGameIds([]);
      fetchGames(
        page,
        debouncedSearch,
        genre,
        status,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bulk update failed");
    }
  };

  const bulkDelete = async () => {
    try {
      await api.post("/api/game/bulk-delete", {
        gameIds: selectedGameIds,
      });

      toast.success("Games deleted successfully");
      setSelectedGameIds([]);
      fetchGames(
        page,
        debouncedSearch,
        genre,
        status,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bulk delete failed");
    }
  };

  const hasBulkSelection = selectedGameIds.length > 0;

  if (loading)
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      <EditGameDialog
        game={editingGame}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() =>
          fetchGames(
            page,
            debouncedSearch,
            genre,
            status,
            sortBy,
            sortOrder,
            dateFrom,
            dateTo,
          )
        }
      />

      {/* FILTERS BAR */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Genre Filter */}
          <div className="space-y-2">
            <Label>Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger>
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as "ASC" | "DESC")}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">ASC</SelectItem>
                  <SelectItem value="DESC">DESC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label>Date From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label>Date To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  disabled={(date) => (dateFrom ? date < dateFrom : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {search && (
              <Badge variant="secondary">
                Search: {search}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => setSearch("")}
                />
              </Badge>
            )}
            {genre !== "all" && (
              <Badge variant="secondary">
                Genre: {genre}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => setGenre("all")}
                />
              </Badge>
            )}
            {status !== "all" && (
              <Badge variant="secondary">
                Status: {status}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => setStatus("all")}
                />
              </Badge>
            )}
            {dateFrom && (
              <Badge variant="secondary">
                From: {format(dateFrom, "PP")}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => setDateFrom(undefined)}
                />
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary">
                To: {format(dateTo, "PP")}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => setDateTo(undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {games.length} games
          {hasActiveFilters && " (filtered)"}
        </span>
      </div>

      {/* BULK ACTIONS BAR */}
      {canBulkManage && hasBulkSelection && (
        <Card className="flex items-center justify-between p-4 border-primary shadow-md sticky top-20 z-10 bg-background">
          <span className="text-sm font-medium flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">
              {selectedGameIds.length}
            </span>
            selected
          </span>
          <div className="flex gap-2">
            {canUpdateGame && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateStatus(true)}
                >
                  Set Active
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateStatus(false)}
                >
                  Set Inactive
                </Button>
              </>
            )}
            {canDeleteGame && (
              <Button variant="destructive" size="sm" onClick={bulkDelete}>
                Delete
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* GRID LAYOUT */}
      {games.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <Gamepad2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No games found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Try adjusting your filters or search terms
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Select All Row */}
          {canBulkManage && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="select-all"
                checked={
                  selectedGameIds.length > 0 &&
                  selectedGameIds.length === games.length
                }
                onCheckedChange={toggleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Select All
              </label>
            </div>
          )}

          {/* Games Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game) => (
              <Card
                key={game.id}
                className={`flex flex-col overflow-hidden transition-shadow hover:shadow-lg ${
                  !game.isActive ? "opacity-60 grayscale" : ""
                }`}
              >
                {/* Image Section */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {game.imageUrl ? (
                    <img
                      src={game.imageUrl}
                      alt={game.name || "Game"}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Gamepad2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {!game.isActive && (
                    <Badge
                      variant="destructive"
                      className="absolute right-2 top-2"
                    >
                      Offline
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Bulk Select Checkbox */}
                      {canBulkManage && (
                        <Checkbox
                          checked={selectedGameIds.includes(game.id)}
                          onCheckedChange={() => toggleSelectGame(game.id)}
                          className="mt-1"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-1 text-lg">
                          {game.name}
                        </CardTitle>
                        {game.genre && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {game.genre}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions Menu */}
                    {canManageGames && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canToggleStatus && (
                            <>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="flex items-center justify-between gap-4"
                              >
                                <span>Active</span>
                                <Switch
                                  checked={game.isActive}
                                  onCheckedChange={() =>
                                    toggleGameStatus(game.id, game.isActive)
                                  }
                                />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {canUpdateGame && (
                            <DropdownMenuItem onClick={() => handleEdit(game)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteGame && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(game)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 h-10 text-sm">
                    {game.description}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="mt-auto flex items-center gap-2 pt-0">
                  <Button
                    asChild
                    className="w-full"
                    disabled={!game.isActive}
                    variant={game.isActive ? "default" : "secondary"}
                  >
                    <a
                      href={game.gameUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Play Now
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && goToPage(page - 1)}
                className={
                  page === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {getPaginationRange(page, totalPages).map((item, i) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={page === item}
                    onClick={() => goToPage(Number(item))}
                    className="cursor-pointer"
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => page < totalPages && goToPage(page + 1)}
                className={
                  page === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* DELETE ALERT */}
      <AlertDialog
        open={!!gameToDelete}
        onOpenChange={() => setGameToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete game?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-bold">{gameToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!gameToDelete) return;
                try {
                  await api.delete("/api/game/delete", {
                    data: { gameId: gameToDelete.id },
                  });
                  toast.success("Game deleted successfully");
                  fetchGames(
                    page,
                    debouncedSearch,
                    genre,
                    status,
                    sortBy,
                    sortOrder,
                    dateFrom,
                    dateTo,
                  );
                  setGameToDelete(null);
                } catch (err: any) {
                  toast.error(
                    err.response?.data?.message || "Failed to delete game",
                  );
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
