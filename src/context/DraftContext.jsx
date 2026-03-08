import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { uid, normaliseHeaders } from '../utils/helpers'
import { TOTAL_BUDGET } from '../utils/constants'

const DraftContext = createContext(null)

const STORAGE_KEY = 'auction-draft-state'

const initialState = {
  players: [],
  teams: [],
  statHeaders: [], // the 6 display column headers from the xlsx
}

function reducer(state, action) {
  switch (action.type) {

    case 'AUTO_LOAD_PLAYERS': {
      // action: { players: [{name, position, statCols, dollarValue}], statHeaders }
      // Build a lookup map from the xlsx data (normalise name for matching)
      const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '')
      const xlsxMap = new Map()
      action.players.filter(p => p.name).forEach(p => {
        xlsxMap.set(normalize(p.name), p)
      })

      if (state.players.length > 0) {
        // Players already exist — just patch statCols/dollarValue without touching assignments
        const patched = state.players.map(p => {
          const match = xlsxMap.get(normalize(p.name))
          if (!match) return p
          return { ...p, statCols: match.statCols || {}, dollarValue: match.dollarValue ?? p.dollarValue }
        })
        return { ...state, players: patched, statHeaders: action.statHeaders }
      }

      // No players yet — create fresh from xlsx
      const newPlayers = action.players
        .filter(p => p.name)
        .map(p => ({
          id: uid(),
          name: p.name,
          position: p.position || '',
          statCols: p.statCols || {},
          dollarValue: p.dollarValue,
          projectedValue: null,
          status: 'available',
          teamId: null,
          purchasedPrice: null,
          rosterSlot: null,
        }))
      return { ...state, players: newPlayers, statHeaders: action.statHeaders }
    }

    case 'IMPORT_PLAYERS': {
      // Manual CSV/xlsx import — replaces player list
      const newPlayers = action.rows.map(row => {
        const norm = normaliseHeaders(row)
        return {
          id: uid(),
          name: norm.name?.trim() || 'Unknown',
          position: norm.position?.trim().toUpperCase() || '',
          statCols: {},
          projectedValue: norm.projectedValue != null && norm.projectedValue !== ''
            ? parseFloat(norm.projectedValue) : null,
          dollarValue: norm.dollarValue != null && norm.dollarValue !== ''
            ? parseFloat(norm.dollarValue) : null,
          status: 'available',
          teamId: null,
          purchasedPrice: null,
          rosterSlot: null,
        }
      }).filter(p => p.name && p.name !== 'Unknown')

      return { ...state, players: newPlayers }
    }

    case 'ADD_TEAM': {
      const team = {
        id: uid(),
        name: action.name.trim(),
        budget: TOTAL_BUDGET,
      }
      return { ...state, teams: [...state.teams, team] }
    }

    case 'REMOVE_TEAM': {
      // Release any players assigned to this team
      const releasedPlayers = state.players.map(p =>
        p.teamId === action.teamId
          ? { ...p, status: 'available', teamId: null, purchasedPrice: null, rosterSlot: null }
          : p
      )
      return {
        ...state,
        teams: state.teams.filter(t => t.id !== action.teamId),
        players: releasedPlayers,
      }
    }

    case 'RENAME_TEAM': {
      return {
        ...state,
        teams: state.teams.map(t =>
          t.id === action.teamId ? { ...t, name: action.name.trim() } : t
        ),
      }
    }

    case 'ASSIGN_PLAYER': {
      // action: { playerId, teamId, price, rosterSlot, isKeeper }
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId
            ? {
                ...p,
                status: action.isKeeper ? 'keeper' : 'purchased',
                teamId: action.teamId,
                purchasedPrice: action.price,
                rosterSlot: action.rosterSlot,
              }
            : p
        ),
      }
    }

    case 'UNASSIGN_PLAYER': {
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId
            ? { ...p, status: 'available', teamId: null, purchasedPrice: null, rosterSlot: null }
            : p
        ),
      }
    }

    case 'ADD_CUSTOM_PLAYER': {
      const player = {
        id: uid(),
        name: action.name.trim(),
        position: action.position?.trim().toUpperCase() || '',
        statCols: {},
        projectedValue: null,
        dollarValue: null,
        status: 'available',
        teamId: null,
        purchasedPrice: null,
        rosterSlot: null,
      }
      return { ...state, players: [...state.players, player] }
    }

    case 'ADD_AND_ASSIGN_KEEPER': {
      const newPlayer = {
        id: uid(),
        name: action.player.name.trim(),
        position: action.player.position.trim().toUpperCase(),
        statCols: {},
        projectedValue: null,
        dollarValue: null,
        status: 'keeper',
        teamId: action.teamId,
        purchasedPrice: action.price,
        rosterSlot: action.rosterSlot,
      }
      return { ...state, players: [...state.players, newPlayer] }
    }

    case 'SEED_PLAYERS': {
      const SAMPLE = [
        // Catchers
        { name: 'William Contreras', position: 'C', projectedValue: 28, dollarValue: 26 },
        { name: 'Adley Rutschman', position: 'C', projectedValue: 32, dollarValue: 30 },
        { name: 'J.T. Realmuto', position: 'C', projectedValue: 22, dollarValue: 20 },
        { name: 'Cal Raleigh', position: 'C', projectedValue: 25, dollarValue: 23 },
        { name: 'Sean Murphy', position: 'C', projectedValue: 20, dollarValue: 18 },
        { name: 'Gabriel Moreno', position: 'C', projectedValue: 15, dollarValue: 13 },
        { name: 'Patrick Bailey', position: 'C', projectedValue: 12, dollarValue: 10 },
        { name: 'Tyler Stephenson', position: 'C', projectedValue: 10, dollarValue: 8 },
        // First Base
        { name: 'Freddie Freeman', position: '1B', projectedValue: 42, dollarValue: 40 },
        { name: 'Pete Alonso', position: '1B', projectedValue: 35, dollarValue: 33 },
        { name: 'Vladimir Guerrero Jr.', position: '1B', projectedValue: 38, dollarValue: 36 },
        { name: 'Christian Walker', position: '1B', projectedValue: 28, dollarValue: 26 },
        { name: 'Paul Goldschmidt', position: '1B', projectedValue: 22, dollarValue: 20 },
        { name: 'Matt Olson', position: '1B', projectedValue: 30, dollarValue: 28 },
        { name: 'Josh Bell', position: '1B', projectedValue: 14, dollarValue: 12 },
        // Second Base
        { name: 'José Altuve', position: '2B', projectedValue: 30, dollarValue: 28 },
        { name: 'Marcus Semien', position: '2B', projectedValue: 32, dollarValue: 30 },
        { name: 'Gleyber Torres', position: '2B', projectedValue: 22, dollarValue: 20 },
        { name: 'Luis Arraez', position: '2B', projectedValue: 20, dollarValue: 18 },
        { name: 'Ozzie Albies', position: '2B', projectedValue: 28, dollarValue: 26 },
        { name: 'Whit Merrifield', position: '2B', projectedValue: 15, dollarValue: 13 },
        // Third Base
        { name: 'Manny Machado', position: '3B', projectedValue: 35, dollarValue: 33 },
        { name: 'Austin Riley', position: '3B', projectedValue: 34, dollarValue: 32 },
        { name: 'Rafael Devers', position: '3B', projectedValue: 36, dollarValue: 34 },
        { name: 'Nolan Arenado', position: '3B', projectedValue: 28, dollarValue: 26 },
        { name: 'Jose Ramirez', position: '3B', projectedValue: 48, dollarValue: 46 },
        { name: 'Gunnar Henderson', position: '3B', projectedValue: 40, dollarValue: 38 },
        { name: 'Max Muncy', position: '3B', projectedValue: 22, dollarValue: 20 },
        // Shortstop
        { name: 'Trea Turner', position: 'SS', projectedValue: 38, dollarValue: 36 },
        { name: 'Xander Bogaerts', position: 'SS', projectedValue: 26, dollarValue: 24 },
        { name: 'Bo Bichette', position: 'SS', projectedValue: 30, dollarValue: 28 },
        { name: 'Corey Seager', position: 'SS', projectedValue: 35, dollarValue: 33 },
        { name: 'Carlos Correa', position: 'SS', projectedValue: 28, dollarValue: 26 },
        { name: 'Francisco Lindor', position: 'SS', projectedValue: 36, dollarValue: 34 },
        { name: 'Willy Adames', position: 'SS', projectedValue: 25, dollarValue: 23 },
        // Outfield
        { name: 'Ronald Acuña Jr.', position: 'OF', projectedValue: 58, dollarValue: 56 },
        { name: 'Mike Trout', position: 'OF', projectedValue: 42, dollarValue: 40 },
        { name: 'Mookie Betts', position: 'OF', projectedValue: 44, dollarValue: 42 },
        { name: 'Juan Soto', position: 'OF', projectedValue: 46, dollarValue: 44 },
        { name: 'Yordan Alvarez', position: 'OF', projectedValue: 45, dollarValue: 43 },
        { name: 'Kyle Tucker', position: 'OF', projectedValue: 40, dollarValue: 38 },
        { name: 'Julio Rodriguez', position: 'OF', projectedValue: 38, dollarValue: 36 },
        { name: 'Cody Bellinger', position: 'OF', projectedValue: 28, dollarValue: 26 },
        { name: 'Cedric Mullins', position: 'OF', projectedValue: 22, dollarValue: 20 },
        { name: 'Bryan Reynolds', position: 'OF', projectedValue: 26, dollarValue: 24 },
        { name: 'Lars Nootbaar', position: 'OF', projectedValue: 20, dollarValue: 18 },
        { name: 'Randy Arozarena', position: 'OF', projectedValue: 28, dollarValue: 26 },
        { name: 'George Springer', position: 'OF', projectedValue: 24, dollarValue: 22 },
        { name: 'Teoscar Hernandez', position: 'OF', projectedValue: 26, dollarValue: 24 },
        { name: 'Luis Robert Jr.', position: 'OF', projectedValue: 32, dollarValue: 30 },
        // DH
        { name: 'Shohei Ohtani', position: 'DH', projectedValue: 55, dollarValue: 53 },
        { name: 'Nelson Cruz', position: 'DH', projectedValue: 12, dollarValue: 10 },
        // Starting Pitchers
        { name: 'Gerrit Cole', position: 'SP', projectedValue: 38, dollarValue: 36 },
        { name: 'Spencer Strider', position: 'SP', projectedValue: 42, dollarValue: 40 },
        { name: 'Sandy Alcantara', position: 'SP', projectedValue: 34, dollarValue: 32 },
        { name: 'Zack Wheeler', position: 'SP', projectedValue: 32, dollarValue: 30 },
        { name: 'Justin Verlander', position: 'SP', projectedValue: 26, dollarValue: 24 },
        { name: 'Max Scherzer', position: 'SP', projectedValue: 22, dollarValue: 20 },
        { name: 'Kevin Gausman', position: 'SP', projectedValue: 28, dollarValue: 26 },
        { name: 'Logan Webb', position: 'SP', projectedValue: 28, dollarValue: 26 },
        { name: 'Framber Valdez', position: 'SP', projectedValue: 26, dollarValue: 24 },
        { name: 'Dylan Cease', position: 'SP', projectedValue: 30, dollarValue: 28 },
        { name: 'Corbin Burnes', position: 'SP', projectedValue: 32, dollarValue: 30 },
        { name: 'Brandon Woodruff', position: 'SP', projectedValue: 20, dollarValue: 18 },
        { name: 'Luis Castillo', position: 'SP', projectedValue: 28, dollarValue: 26 },
        { name: 'Freddy Peralta', position: 'SP', projectedValue: 22, dollarValue: 20 },
        { name: 'Pablo Lopez', position: 'SP', projectedValue: 24, dollarValue: 22 },
        { name: 'Sonny Gray', position: 'SP', projectedValue: 20, dollarValue: 18 },
        { name: 'MacKenzie Gore', position: 'SP', projectedValue: 18, dollarValue: 16 },
        { name: 'Tyler Glasnow', position: 'SP', projectedValue: 26, dollarValue: 24 },
        { name: 'Shane McClanahan', position: 'SP', projectedValue: 30, dollarValue: 28 },
        { name: 'George Kirby', position: 'SP', projectedValue: 24, dollarValue: 22 },
        // Relief Pitchers
        { name: 'Edwin Diaz', position: 'RP', projectedValue: 28, dollarValue: 26 },
        { name: 'Felix Bautista', position: 'RP', projectedValue: 26, dollarValue: 24 },
        { name: 'Ryan Helsley', position: 'RP', projectedValue: 24, dollarValue: 22 },
        { name: 'Alexis Diaz', position: 'RP', projectedValue: 20, dollarValue: 18 },
        { name: 'Camilo Doval', position: 'RP', projectedValue: 18, dollarValue: 16 },
        { name: 'Jordan Romano', position: 'RP', projectedValue: 18, dollarValue: 16 },
        { name: 'Emmanuel Clase', position: 'RP', projectedValue: 25, dollarValue: 23 },
        { name: 'Clay Holmes', position: 'RP', projectedValue: 16, dollarValue: 14 },
        { name: 'Josh Hader', position: 'RP', projectedValue: 22, dollarValue: 20 },
        { name: 'Devin Williams', position: 'RP', projectedValue: 20, dollarValue: 18 },
      ]
      const newPlayers = SAMPLE.map(p => ({
        id: uid(),
        name: p.name,
        position: p.position,
        projectedValue: p.projectedValue,
        dollarValue: p.dollarValue,
        status: 'available',
        teamId: null,
        purchasedPrice: null,
        rosterSlot: null,
      }))
      return { ...state, players: newPlayers }
    }

    case 'SEED_TEAMS': {
      const DEFAULT_NAMES = [
        'Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5',
        'Team 6', 'Team 7', 'Team 8', 'Team 9', 'Team 10',
      ]
      const newTeams = DEFAULT_NAMES.map(name => ({
        id: uid(),
        name,
        budget: TOTAL_BUDGET,
      }))
      return { ...state, teams: newTeams }
    }

    case 'CLEAR_ALL': {
      return {
        ...state,
        teams: [],
        players: state.players.map(p => ({
          ...p,
          status: 'available',
          teamId: null,
          purchasedPrice: null,
          rosterSlot: null,
        })),
      }
    }

    case 'RESET_DRAFT': {
      // Keep teams and players but clear all assignments
      return {
        ...state,
        players: state.players.map(p => ({
          ...p,
          status: 'available',
          teamId: null,
          purchasedPrice: null,
          rosterSlot: null,
        })),
      }
    }

    case 'LOAD': {
      return action.state
    }

    default:
      return state
  }
}

export function DraftProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : initialState
    } catch {
      return initialState
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <DraftContext.Provider value={{ state, dispatch }}>
      {children}
    </DraftContext.Provider>
  )
}

export function useDraft() {
  return useContext(DraftContext)
}
