import React, { PureComponent } from 'react';
import { Field, Cell } from './Field';
import { ScoreBoard } from './ScoreBoard';
import { genRandomField, CELL_STATE } from '../helpers/field'

import './DashBoard.css';

// images for cells
import hitImg from '../assets/hit.png';
import missImg from '../assets/miss.png';

// images for ships
import aircraftImg from '../assets/aircraft-shape.png';
import battleshipImg from '../assets/battleship-shape.png';
import cruiserImg from '../assets/cruiser-shape.png';
import submarineImg from '../assets/submarine-shape.png';
import carrierImg from '../assets/carrier-shape.png';
import { ShipBoard } from './ShipBoard';

const cellAttrs = {
  [CELL_STATE.MISS]: { tag: 'image', xlinkHref: missImg },
  [CELL_STATE.HIT]: { tag: 'image', xlinkHref: hitImg }
};

const shipsLayout = [
  { type: 'aircraft', size: 5, count: 1, image: aircraftImg  },
  { type: 'battleship', size: 4, count: 2, image: battleshipImg },
  { type: 'cruiser', size: 3, count: 3, image: cruiserImg },
  { type: 'submarine', size: 2, count: 4, image: submarineImg },
  { type: 'carrier', size: 1, count: 5, image: carrierImg }
];


const GAME_STATE = {
  PLAYER_1_TURN: 'player-1',
  OVER: 'over'
};

const FIELD_SIZE = 10;

export class DashBoard extends PureComponent {

  state = {
    size: FIELD_SIZE,
    gameState: GAME_STATE.PLAYER_1_TURN,
    ...this.reset()
  }

  /**
   * Update cell on a given field
   * @param {Array<Array<Object>>} field - field to update
   * @param {number} x - x coordinate of cell to update
   * @param {number} y - y coordinate of cell to update
   * @param {any} data - data to update
   * @returns {Array<Array<Object>>}
   */
  updateCell(field, x, y, data = {}) {
    if (!field || !field[x] || !field[x][y]) {
      return field;
    }
    const newField = field.slice();
    newField[x] = newField[x].map((c, i) => i === y ? { ...c, ...data }: c);
    return newField;
  }

  /**
   * Update ship and return fresh ships array
   * @param {Array<Object>} ships - ships to update
   * @param {number} index - ship to update
   * @param {any} data - data to change
   * @returns {Array<Object>}
   */
  updateShip(ships, index, data = {}) {
    if (!ships || !ships[index]) {
      return ships;
    }
    const newShips = ships.slice();
    newShips[index] = {
      ...newShips[index],
      ...data
    }
    return newShips;
  }

  /**
   * Perform player stroke and return a new player state
   * @param {Object} state - previous player state
   * @param {Object} cell - cell to update
   * @returns {Object} new player state or nothing if nothing to update
   */
  ply({ field, ships }, cell) {
    if (cell.state === CELL_STATE.EMPTY || cell.state === CELL_STATE.SHIP) {
      const newField = this.updateCell(field, cell.x, cell.y, { state: cell.state === CELL_STATE.SHIP ? CELL_STATE.HIT : CELL_STATE.MISS });
      const newShips = cell.ship !== -1 ? this.updateShip(ships, cell.ship, { life: ships[cell.ship].life - 1 }) : ships;
      return {
        gameState: newShips.every(ship => ship.life === 0) ? GAME_STATE.OVER : GAME_STATE.PLAYER_1_TURN,
        player: {
          field: newField,
          ships: newShips
        }
      }
    }
  }

  /**
   * Reset game state
   * @returns {Object} fresh game state
   */
  reset() {
    return {
      gameState: GAME_STATE.PLAYER_1_TURN,
      [GAME_STATE.PLAYER_1_TURN]: genRandomField(FIELD_SIZE, shipsLayout)
    }
  }

  /**
   * Handle game actions
   * @param {any} data - action data
   */
  handleAction = (data) => {
    this.setState(state => {
      switch (state.gameState) {
        case GAME_STATE.OVER:
          return this.reset();
        case GAME_STATE.PLAYER_1_TURN:
          const {x, y} = data;
          const playerState = state[state.gameState]
          const cell = playerState.field[x][y];
          const result = this.ply(playerState, cell);
          return result && {
            gameState: result.gameState,
            [state.gameState]: result.player
          };
        default:
          return;
      }
    })
  }

  getCells(field) {
    return [].concat(...field).filter(cell => cell.state === CELL_STATE.MISS || cell.state === CELL_STATE.HIT)
  }

  getScroes(state) {
    const player = this.state[GAME_STATE.PLAYER_1_TURN].ships.reduce((acc, ship) => acc + (ship.size - ship.life), 0);
    return [player, 0];
  }

  renderCell = (cell) => {
    const { x, y } = cell;
    return <Cell key={`cell-${x}-${y}`} x={x} y={y} {...(cellAttrs[cell.state] || {})} />
  }

  render() {
    const { gameState } = this.state;
    const isGameOver =  gameState === GAME_STATE.OVER;
    const playerName = isGameOver ? GAME_STATE.PLAYER_1_TURN : gameState;
    const cells = this.getCells(this.state[playerName].field);
    return (
      <div className="dashboard" {...this.props}>
        <div className="main-board">
          <ScoreBoard scores={this.getScroes(this.state)} />
          <ShipBoard className="main-shipboard" ships={this.state[playerName].ships} />
        </div>
        <div className="play-field player-1">
          <Field onCellClick={this.handleAction} renderCell={this.renderCell} cells={cells} />
          {isGameOver ? (
            <div className="game-over">
              Game over <br/>
              <button type="button" className="reset-button" onClick={this.handleAction}>Restart</button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}