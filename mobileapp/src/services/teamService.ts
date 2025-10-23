import { Team, TeamMember, ApiError } from '../types';
import { Config } from '../constants';
import { StorageUtils } from '../utils';

export interface TeamRequest {
  name: string;
  description?: string;
}

export interface AddMemberRequest {
  email: string;
}

export interface TeamResponse extends Team {
  memberCount: number;
  userRole: 'owner' | 'member' | 'none';
}

export interface TeamMemberResponse extends TeamMember {
  email: string;
  name: string;
}

export class TeamService {
  private baseUrl = Config.apiBaseUrl;

  private async getAuthToken(): Promise<string> {
    const token = await StorageUtils.getSecureItem(Config.storageKeys.authToken);
    if (!token) {
      throw new Error('No auth token found');
    }
    return token;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async createTeam(request: TeamRequest): Promise<TeamResponse> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    return this.handleResponse<TeamResponse>(response);
  }

  async getUserTeams(): Promise<TeamResponse[]> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return this.handleResponse<TeamResponse[]>(response);
  }

  async getTeam(teamId: string): Promise<TeamResponse> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams/${teamId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return this.handleResponse<TeamResponse>(response);
  }

  async updateTeam(teamId: string, request: TeamRequest): Promise<TeamResponse> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    return this.handleResponse<TeamResponse>(response);
  }

  async deleteTeam(teamId: string): Promise<void> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams/${teamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
  }

  async addMember(teamId: string, request: AddMemberRequest): Promise<TeamMemberResponse> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams/${teamId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    return this.handleResponse<TeamMemberResponse>(response);
  }

  async getTeamMembers(teamId: string): Promise<TeamMemberResponse[]> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams/${teamId}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return this.handleResponse<TeamMemberResponse[]>(response);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Remove failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
  }

  async leaveTeam(teamId: string): Promise<void> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/teams/${teamId}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Leave failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
  }
}

export const teamService = new TeamService();
