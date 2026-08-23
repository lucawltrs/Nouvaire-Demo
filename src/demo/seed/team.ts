import type { TeamMember } from '../../modules/shared/services/teamApi';
import type { Group } from '../../modules/shared/services/groupsApi';
import { DEMO_TEAM } from './auth';

const TEAM_INFO = {
  id: DEMO_TEAM.team_id,
  name: DEMO_TEAM.team_name,
  slug: DEMO_TEAM.team_slug,
  description: 'Demo-Team für die Nouvaire.io Produktvorführung',
};

export const DEMO_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    user_id: 1,
    team_id: DEMO_TEAM.team_id,
    role: 'admin',
    active_shift: false,
    user: { id: 1, name: 'Demo Admin', email: 'demo@nouvaire.io' },
    team: TEAM_INFO,
  },
  {
    id: 2,
    user_id: 2,
    team_id: DEMO_TEAM.team_id,
    role: 'chatter',
    active_shift: true,
    user: { id: 2, name: 'Mara Keller', email: 'mara.keller@nouvaire.io' },
    team: TEAM_INFO,
  },
  {
    id: 3,
    user_id: 3,
    team_id: DEMO_TEAM.team_id,
    role: 'chatter',
    active_shift: false,
    user: { id: 3, name: 'Jonas Vogt', email: 'jonas.vogt@nouvaire.io' },
    team: TEAM_INFO,
  },
  {
    id: 4,
    user_id: 4,
    team_id: DEMO_TEAM.team_id,
    role: 'chatter',
    active_shift: true,
    user: { id: 4, name: 'Sophie Lindt', email: 'sophie.lindt@nouvaire.io' },
    team: TEAM_INFO,
  },
];

export const DEMO_GROUPS: Group[] = [
  {
    id: 1,
    name: 'Team Früh',
    description: 'Schicht 06:00 – 14:00',
    team_id: DEMO_TEAM.team_id,
    created_at: '2025-01-05T08:00:00.000Z',
    updated_at: '2025-01-05T08:00:00.000Z',
    team_users: [
      { id: 2, user_id: 2, team_id: DEMO_TEAM.team_id, role: 'chatter', team_group_id: 1, user: { id: 2, name: 'Mara Keller', email: 'mara.keller@nouvaire.io' } },
    ],
  },
  {
    id: 2,
    name: 'Team Spät',
    description: 'Schicht 14:00 – 22:00',
    team_id: DEMO_TEAM.team_id,
    created_at: '2025-01-05T08:00:00.000Z',
    updated_at: '2025-01-05T08:00:00.000Z',
    team_users: [
      { id: 3, user_id: 3, team_id: DEMO_TEAM.team_id, role: 'chatter', team_group_id: 2, user: { id: 3, name: 'Jonas Vogt', email: 'jonas.vogt@nouvaire.io' } },
      { id: 4, user_id: 4, team_id: DEMO_TEAM.team_id, role: 'chatter', team_group_id: 2, user: { id: 4, name: 'Sophie Lindt', email: 'sophie.lindt@nouvaire.io' } },
    ],
  },
];
