/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string | null;
  description: string | null;
  genre: string | null;
  imageUrl: string | null;
  gameUrl: string | null;
  isActive: boolean;
}

interface Permission {
  id: string;
  key: string;
  description: string;
}

interface UserRole {
  permissions: Permission[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  userRole: UserRole;
}

/* ---------------- Permission Helper ---------------- */
const hasPermission = (user: User | null, permissionKey: string): boolean => {
  if (!user?.userRole?.permissions) return false;
  
  return user.userRole.permissions.some(
    (permission) => permission.key === permissionKey
  );
};

/* ---------------- Pagination Helper ---------------- */
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

/* ---------------- Edit Dialog ---------------- */
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
        genre: game.genre || "",
        imageUrl: game.imageUrl || "",
        gameUrl: game.gameUrl || "",
      });
    }
  }, [game]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game) return;
    console.log(formData);

    setIsSaving(true);
    try {
      await api.put(`/api/game/update/${game.id}`, {
        data: formData,
      });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key} className="grid grid-cols-4 gap-4 items-center">
              <Label className="text-right capitalize">{key}</Label>
              <Input
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

/* ---------------- Main Table ---------------- */
export default function GameTable({ user }: { user: User }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageFromUrl = Number(searchParams.get("page")) || 1;

  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  // Permission checks
  const canUpdateGame = hasPermission(user, "game.update");
  const canDeleteGame = hasPermission(user, "game.delete");
  const canToggleStatus = hasPermission(user, "game.update"); // or create a separate "game.toggle" permission
  
  // Show actions column if user has any management permission
  const showActionsColumn = canUpdateGame || canDeleteGame || canToggleStatus;

  const fetchGames = async (pageNumber = page, silent = false) => {
    if (!silent) setLoading(true);

    try {
      const res = await api.get(
        `/api/game/showallgames?page=${pageNumber}&limit=10`
      );

      setGames(res.data.games);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch games");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const goToPage = (p: number) => {
    setPage(p);
    router.push(`?page=${p}`, { scroll: false });
    fetchGames(p);
  };

  useEffect(() => {
    fetchGames(pageFromUrl);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGames(page, true);
    }, 20000);
    return () => clearInterval(interval);
  }, [page]);

  if (loading) return <p>Loading...</p>;

  const toggleGameStatus = async (gameId: string, currentState: boolean) => {
    // Check permission before toggling
    if (!canToggleStatus) {
      toast.error("You don't have permission to change game status");
      return;
    }

    // 1️⃣ Optimistic update
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, isActive: !currentState } : g))
    );

    try {
      // 2️⃣ API call
      await api.patch("/api/game/toggleactive", {
        gameId,
      });
      toast.success("Game status updated");
    } catch (error: any) {
      // 3️⃣ Rollback on failure
      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId ? { ...g, isActive: currentState } : g
        )
      );

      toast.error(error.response?.data?.message || "Failed to update game status");
      console.error("Failed to update game status", error);
    }
  };

  const handleEdit = (game: Game) => {
    if (!canUpdateGame) {
      toast.error("You don't have permission to edit games");
      return;
    }
    setEditingGame(game);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (game: Game) => {
    if (!canDeleteGame) {
      toast.error("You don't have permission to delete games");
      return;
    }
    setGameToDelete(game);
  };

  return (
    <>
      <EditGameDialog
        game={editingGame}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => fetchGames(page)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>URL</TableHead>
            {showActionsColumn && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow key={game.id}>
              <TableCell>{game.name}</TableCell>
              <TableCell>{game.description}</TableCell>
              <TableCell>{game.genre}</TableCell>
              <TableCell>
                {game.imageUrl && (
                  <img src={game.imageUrl} className="h-10 w-10 rounded" />
                )}
              </TableCell>
              <TableCell>
                <a href={game.gameUrl ?? "#"} target="_blank" className="text-blue-600 hover:underline">
                  Play
                </a>
              </TableCell>

              {showActionsColumn && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Show toggle status only if user has permission */}
                      {canToggleStatus && (
                        <>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()} // prevent close
                            className="flex items-center justify-between cursor-default"
                          >
                            <span>Status</span>
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

                      {/* Show edit only if user has permission */}
                      {canUpdateGame && (
                        <DropdownMenuItem onClick={() => handleEdit(game)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      )}

                      {/* Show delete only if user has permission */}
                      {canDeleteGame && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(game)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* PAGINATION */}
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => page > 1 && goToPage(page - 1)}
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
                  onClick={() => goToPage(item)}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => page < totalPages && goToPage(page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* DELETE ALERT */}
      <AlertDialog
        open={!!gameToDelete}
        onOpenChange={() => setGameToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete game?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={async () => {
                if (!gameToDelete) return; // safety check
                try {
                  const { data } = await api.delete("/api/game/delete", {
                    data: { gameId: gameToDelete.id },
                  });
                  console.log("Delete response:", data);

                  toast.success("Game deleted successfully");
                  // Refresh games after deletion
                  fetchGames(page);
                  setGameToDelete(null);
                } catch (err: any) {
                  toast.error(err.response?.data?.message || "Failed to delete game");
                  console.log(
                    "Failed to delete game:",
                    err.response?.data?.message || err.message
                  );
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}