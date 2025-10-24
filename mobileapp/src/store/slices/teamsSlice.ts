import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TeamState, Team, TeamMember } from '../../types';
import { teamService, TeamRequest, TeamResponse, TeamMemberResponse, AddMemberRequest } from '../../services/teamService';
import { DatabaseService } from '../../services/database/DatabaseService';

const initialState: TeamState = {
  teams: [],
  currentTeam: null,
  members: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserTeams = createAsyncThunk(
  'teams/fetchUserTeams',
  async (_, { rejectWithValue }) => {
    try {
      const teams = await teamService.getUserTeams();

      // Save team members to local database for each team
      const dbService = DatabaseService.getInstance();
      await dbService.initializeDatabase();

      // Fetch and save members for each team
      for (const team of teams) {
        try {
          const members = await teamService.getTeamMembers(team.id);
          await dbService.saveTeamMembers(team.id, members);
        } catch (error) {
          console.error(`Failed to save members for team ${team.id}:`, error);
        }
      }

      return teams;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch teams');
    }
  }
);

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (request: TeamRequest, { rejectWithValue }) => {
    try {
      const team = await teamService.createTeam(request);
      return team;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create team');
    }
  }
);

export const fetchTeam = createAsyncThunk(
  'teams/fetchTeam',
  async (teamId: string, { rejectWithValue }) => {
    try {
      const team = await teamService.getTeam(teamId);
      return team;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch team');
    }
  }
);

export const updateTeam = createAsyncThunk(
  'teams/updateTeam',
  async ({ teamId, request }: { teamId: string; request: TeamRequest }, { rejectWithValue }) => {
    try {
      const team = await teamService.updateTeam(teamId, request);
      return team;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update team');
    }
  }
);

export const deleteTeam = createAsyncThunk(
  'teams/deleteTeam',
  async (teamId: string, { rejectWithValue }) => {
    try {
      await teamService.deleteTeam(teamId);
      return teamId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete team');
    }
  }
);

export const fetchTeamMembers = createAsyncThunk(
  'teams/fetchTeamMembers',
  async (teamId: string, { rejectWithValue }) => {
    try {
      const members = await teamService.getTeamMembers(teamId);

      // Save members to local database for team task queries
      const dbService = DatabaseService.getInstance();
      await dbService.initializeDatabase();
      await dbService.saveTeamMembers(teamId, members);

      return members;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch team members');
    }
  }
);

export const addTeamMember = createAsyncThunk(
  'teams/addTeamMember',
  async ({ teamId, request }: { teamId: string; request: AddMemberRequest }, { rejectWithValue }) => {
    try {
      const member = await teamService.addMember(teamId, request);

      // Refresh team members in local database
      const members = await teamService.getTeamMembers(teamId);
      const dbService = DatabaseService.getInstance();
      await dbService.initializeDatabase();
      await dbService.saveTeamMembers(teamId, members);

      return member;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add team member');
    }
  }
);

export const removeTeamMember = createAsyncThunk(
  'teams/removeTeamMember',
  async ({ teamId, userId }: { teamId: string; userId: string }, { rejectWithValue }) => {
    try {
      await teamService.removeMember(teamId, userId);

      // Refresh team members in local database
      const members = await teamService.getTeamMembers(teamId);
      const dbService = DatabaseService.getInstance();
      await dbService.initializeDatabase();
      await dbService.saveTeamMembers(teamId, members);

      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove team member');
    }
  }
);

export const leaveTeam = createAsyncThunk(
  'teams/leaveTeam',
  async (teamId: string, { rejectWithValue }) => {
    try {
      await teamService.leaveTeam(teamId);
      return teamId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to leave team');
    }
  }
);

// Slice
export const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearCurrentTeam: (state) => {
      state.currentTeam = null;
      state.members = [];
    },
    clearTeamsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user teams
    builder.addCase(fetchUserTeams.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserTeams.fulfilled, (state, action: PayloadAction<TeamResponse[]>) => {
      state.isLoading = false;
      state.teams = action.payload;
    });
    builder.addCase(fetchUserTeams.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create team
    builder.addCase(createTeam.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createTeam.fulfilled, (state, action: PayloadAction<TeamResponse>) => {
      state.isLoading = false;
      state.teams.push(action.payload);
    });
    builder.addCase(createTeam.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch team
    builder.addCase(fetchTeam.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTeam.fulfilled, (state, action: PayloadAction<TeamResponse>) => {
      state.isLoading = false;
      state.currentTeam = action.payload;
    });
    builder.addCase(fetchTeam.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update team
    builder.addCase(updateTeam.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateTeam.fulfilled, (state, action: PayloadAction<TeamResponse>) => {
      state.isLoading = false;
      const index = state.teams.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.teams[index] = action.payload;
      }
      if (state.currentTeam?.id === action.payload.id) {
        state.currentTeam = action.payload;
      }
    });
    builder.addCase(updateTeam.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Delete team
    builder.addCase(deleteTeam.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteTeam.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.teams = state.teams.filter(t => t.id !== action.payload);
      if (state.currentTeam?.id === action.payload) {
        state.currentTeam = null;
        state.members = [];
      }
    });
    builder.addCase(deleteTeam.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch team members
    builder.addCase(fetchTeamMembers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTeamMembers.fulfilled, (state, action: PayloadAction<TeamMemberResponse[]>) => {
      state.isLoading = false;
      state.members = action.payload;
    });
    builder.addCase(fetchTeamMembers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Add team member
    builder.addCase(addTeamMember.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addTeamMember.fulfilled, (state, action: PayloadAction<TeamMemberResponse>) => {
      state.isLoading = false;
      state.members.push(action.payload);
    });
    builder.addCase(addTeamMember.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Remove team member
    builder.addCase(removeTeamMember.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(removeTeamMember.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.members = state.members.filter(m => m.userId !== action.payload);
    });
    builder.addCase(removeTeamMember.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Leave team
    builder.addCase(leaveTeam.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(leaveTeam.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.teams = state.teams.filter(t => t.id !== action.payload);
      if (state.currentTeam?.id === action.payload) {
        state.currentTeam = null;
        state.members = [];
      }
    });
    builder.addCase(leaveTeam.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearCurrentTeam, clearTeamsError } = teamsSlice.actions;

export default teamsSlice.reducer;
