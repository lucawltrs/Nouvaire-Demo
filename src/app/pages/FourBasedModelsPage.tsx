
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFourBasedModels } from "../../modules/4based/store/useFourBasedModels";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/PageLoader";

const FourBasedModelsPage: React.FC = () => {
  const { users, unreadByUser, loading, error, loadUsers, addCredentials, syncUsers } = useFourBasedModels();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");

  const getProfileUrl = (name: string) => `https://4based.com/profile/${encodeURIComponent(name)}`;

  const usersWithUnread = useMemo(() => {
    return users.map((user) => {
      const summary = unreadByUser[user.fourbased_id];

      return {
        user,
        totalUnreadMessages: summary?.totalUnreadMessages ?? 0,
      };
    });
  }, [users, unreadByUser]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return usersWithUnread
      .filter(({ user }) => {
        const matchesQuery =
          !query ||
          user.name.toLowerCase().includes(query) ||
          user.identifier.toLowerCase().includes(query) ||
          user.fourbased_id.toLowerCase().includes(query);

        return matchesQuery;
      })
      .sort((a, b) => {
        if (b.totalUnreadMessages !== a.totalUnreadMessages) {
          return b.totalUnreadMessages - a.totalUnreadMessages;
        }

        return a.user.name.localeCompare(b.user.name);
      });
  }, [search, usersWithUnread]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async () => {
    await addCredentials(email, password);
    setShowModal(false);
    setEmail("");
    setPassword("");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">4Based Accounts</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowModal(true)}>Hinzufügen</Button>
          <Button onClick={syncUsers} variant="secondary">Sync</Button>
        </div>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <div className="mt-4">
        <Input
          label="Suche"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, Identifier oder 4Based ID"
        />
      </div>
      {loading ? (
        <PageLoader
          message="Lade 4Based Accounts..."
          subtitle="Accounts und ungelesene Nachrichten werden abgerufen"
        />
      ) : (
        <>
      {users.length === 0 && (
        <Card className="p-4 mt-4">
          <p className="text-gray-300">Keine 4Based Accounts gefunden.</p>
        </Card>
      )}
      {users.length > 0 && filteredUsers.length === 0 && (
        <Card className="p-4 mt-4">
          <p className="text-gray-300">Keine Treffer für deine Suche.</p>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {filteredUsers.map(({ user, totalUnreadMessages }) => (
          <Card
            key={user.fourbased_id}
            className={`p-4 ${totalUnreadMessages > 0 ? 'ring-1 ring-yellow-700/50' : ''}`}
            hover
          >
            <div className="flex items-center justify-between gap-4">
              <Link to={`/4based/models/${user.fourbased_id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-4">
                  <img
                    src={user.img_url}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-700"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge size="sm">{user.identifier}</Badge>
                      {totalUnreadMessages > 0 ? (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-red-800 bg-red-900/30">
                          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold">
                            {totalUnreadMessages}
                          </span>
                          <span className="text-sm text-red-200 font-medium">Ungelesene Nachrichten</span>
                        </div>
                      ) : (
                        <Badge size="sm" variant="success">Keine ungelesenen Nachrichten</Badge>
                      )}
                    </div>
                    {totalUnreadMessages > 0 && (
                      <p className="mt-2 text-sm text-yellow-300">Neue Aktivität im Posteingang</p>
                    )}
                  </div>
                </div>
              </Link>

              <a
                href={getProfileUrl(user.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded border border-gray-600 text-cyan-400 hover:border-cyan-500 hover:text-cyan-300"
                aria-label={`Profil von ${user.name} öffnen`}
                title="4Based Profil öffnen"
              >
                ↗
              </a>
            </div>
          </Card>
        ))}
      </div>
        </>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Zugangsdaten hinzufügen">
        <div className="flex flex-col gap-4">
          <Input
            label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            autoFocus
          />
          <Input
            label="Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={handleAdd} disabled={!email || !password || loading}>Speichern</Button>
            <Button onClick={() => setShowModal(false)} variant="secondary">Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FourBasedModelsPage;
