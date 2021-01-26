import React, { Component } from 'react';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Collapse from 'react-bootstrap/Collapse';

import SwordCard from './Components/SwordCard';
import defaultWeapons from './dndInfo/defaultWeapons.json';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      swords: JSON.parse(JSON.stringify(defaultWeapons)).swords,
      damage: {},
      log: {},
      toHit: [],
      showSwords: false,
      showLogs: false,
      showLogDetailed: false,
      turn: 1,
      ememies: 40,
      charStats: {
        hasted: false,
        str: 11,
        dex: 44,
        con: 14,
        int: 10,
        wis: 19,
        cha: 31,
        initLvl: 20,
        hit: 61,
        tumble: 92,
        offAtt: 2,
        growth: false,
        inferno: false,
        belt: false,
      },
      enemyStats: { ac: 10, dr: 0, resist: {}, type: '' },
    };

    this.updateSword = this.updateSword.bind(this);
    this.damage = this.damage.bind(this);
    this.usedEnchants = this.usedEnchants.bind(this);
  }

  usedEnchants() {
    var used = new Set();
    this.state.swords.map((sword) =>
      Object.getOwnPropertyNames(sword.enchantments).map((enchants) =>
        used.add(enchants)
      )
    );
    return used;
  }

  createNewSwords(swords) {
    var s = [];
    for (var i = 0; i < swords; i++)
      s.push({
        active: '',
        baseDamage: { slashing: '1d6' },
        critRange: 18,
        critAmount: 2,
        enhanceBonus: 1,
        enchantments: {},
        crystal: { Witchlight: 'Sunlight' },
        turn: null,
      });
    return s;
  }

  updateSword(id, value) {
    var newSwords = this.state.swords;
    var index = parseInt(id.split('-')[0]);
    var type = id.split('-')[1];

    switch (type) {
      case 'turn':
        newSwords[index][type] = parseInt(value);
        newSwords[index].active = 'Dancing';
        break;
      case 'critRange':
      case 'active':
        newSwords[index][type] = value;
        break;
      case 'Witchlight':
        newSwords[index].crystal.Witchlight = value;
        break;
      default:
        // enchantments
        if (value)
          newSwords[index].enchantments = Object.assign(
            newSwords[index].enchantments,
            JSON.parse(`{"${type}":${value}}`)
          );
        else if (!!newSwords[index].enchantments[type])
          delete newSwords[index].enchantments[type];
        break;
    }

    setTimeout(
      () =>
        this.setState({
          swords: newSwords,
        }),
      0
    );
  }

  tumble(type) {
    const { ememies, charStats } = this.state;
    const { tumble } = charStats;

    var dc = 10 * (type.split('-')[1] == 'full');
    switch (type.split('-')[0]) {
      case 'around':
        dc += 15;
        break;
      case 'through':
        dc += 25;
        break;
    }

    var passes = [];
    var fails = [];
    for (var i = 0; i < ememies; i++) {
      var roll = this.d20('skill');
      var check = tumble + roll.res;
      if (check < dc)
        fails.push(`enemy:${i + 1} dc: ${dc}, rolled:${roll.roll} ${check}`);
      else
        passes.push(`enemy:${i + 1} dc: ${dc}, rolled:${roll.roll} ${check}`);
      dc += 2;
    }

    setTimeout(() => this.setState({ log: { tumble: { passes, fails } } }), 0);
  }

  attack(type) {
    // 'Hand', 'Off-Hand', 'Dancing', ''
    const { swords, charStats } = this.state;
    const { offAtt, hasted, hit, belt } = charStats;

    var s;
    var att = [];
    var twf = new Set();
    switch (type) {
      case 'dancing':
        for (s = 0; s < swords.length; s++)
          if (
            swords[s].active == 'Dancing' ||
            swords[s].active == 'Everdancing'
          )
            att.push(swords[s]);
        break;
      case 'opportunity':
        for (s = 0; s < swords.length; s++)
          if (swords[s].active == 'Hand') att.push(swords[s]);
        break;
      case 'full':
        for (s = 0; s < swords.length; s++)
          if (swords[s].active != '') {
            att.push(swords[s]);
            if (swords[s].active != 'Dancing') twf.add(swords[s].active);
          }
        break;
    }
    twf = twf.size > 1;

    var att_swords = JSON.parse(JSON.stringify(att));
    for (s = 0; s < att_swords.length; s++) {
      var toHit = [];
      var _hit, attacks;
      var hitMods = -2 * twf + 2 * !!att_swords[s].enchantments.Bane;
      if (type != 'opportunity')
        attacks = att_swords[s].active == 'Off-Hand' ? offAtt : 4;
      else attacks = 1;

      var _belt =
        belt &&
        (att_swords[s].active == 'Off-Hand' || att_swords[s].active == 'Hand');
      for (
        var r = 0;
        r < 1 + _belt;
        r++ //belt of battle check
      )
        for (var a = 0; a < attacks; a++) {
          _hit = this.d20('attack');
          toHit.push({
            crit: _hit.crit,
            roll: _hit.roll,
            hit: _hit.roll + hit - 5 * a + hitMods,
          });
        }

      if (
        ((att_swords[s].active != 'Dancing' ||
          att_swords[s].active != 'Everdancing') &&
          hasted &&
          att_swords[s].active == 'Hand') ||
        !!att_swords[s].enchantments.Speed
      ) {
        // haste / speed
        _hit = this.d20('attack');
        toHit.push({
          crit: _hit.crit,
          roll: _hit.roll,
          hit: _hit.roll + hit + hitMods,
        });
      }

      att_swords[s] = Object.assign(att_swords[s], { toHit: toHit });
      delete att_swords[s].turn;
    }

    setTimeout(
      () =>
        this.setState({
          toHit: att_swords,
        }),
      0
    );
  }

  d20(type) {
    var roll = Math.floor(Math.random() * 20 + 1);
    switch (type) {
      case 'skill':
        return {
          res: roll + (roll == 20) * 5 + (roll == 1) * -5,
          roll: `(${roll})`,
        };
      case 'attack':
        return {
          roll: roll,
          crit: (roll == 20) - (roll == 1),
        };
    }
  }

  damage() {
    const { toHit, enemyStats } = this.state;
    const { ac } = enemyStats;
    var log = [];
    var damages = {};
    var hit;
    for (var s = 0; s < toHit.length; s++)
      for (var h = 0; h < toHit[s].toHit.length; h++) {
        if (!!toHit[s].toHit[h].crit)
          if (toHit[s].toHit[h].crit < 0)
            log.push(
              `Sword: ${s + 1}, attack: ${h + 1}; MISSED, to hit: ${
                toHit[s].toHit[h].hit
              } (${toHit[s].toHit[h].roll})`
            );
          // crit fail
          else {
            // crit success
            hit = this.hit(toHit[s], true);
            damages = this.addDamageObjects(damages, hit.damage);
            log.push(
              `Sword: ${s + 1}, attack: ${h + 1}; CRITICAL HIT, to hit: ${
                toHit[s].toHit[h].hit
              } (${toHit[s].toHit[h].roll}), ac is: ${ac}`
            );
            log.push(hit.log);
          }
        else if (toHit[s].toHit[h].hit >= ac) {
          // regular hit
          hit = this.hit(
            toHit[s],
            toHit[s].toHit[h].roll >= toHit[s].critRange
          );
          damages = this.addDamageObjects(damages, hit.damage);
          log.push(
            `Sword: ${s + 1}, attack: ${h + 1};${
              toHit[s].toHit[h].roll >= toHit[s].critRange
                ? ' THREAT RANGE '
                : ' '
            }HIT, to hit: ${toHit[s].toHit[h].hit} (${
              toHit[s].toHit[h].roll
            }), ac is: ${ac}`
          );
          log.push(hit.log);
        } else
          log.push(
            `Sword: ${s + 1}, attack: ${h + 1}; MISSED, to hit: ${
              toHit[s].toHit[h].hit
            } (${toHit[s].toHit[h].roll}), ac is: ${ac}`
          ); // attacks missed
      }

    setTimeout(
      () =>
        this.setState({
          log: { damage: log },
          damage: damages,
          toHit: [],
          showLogs: true,
        }),
      0
    );
  }

  addDamageObjects(a, b) {
    Object.getOwnPropertyNames(b).map((name) => {
      if (!!a[name]) a[name] += b[name];
    });
    return Object.assign(b, a);
  }

  roll(str) {
    var value = [0];
    var comp = str.split('+');
    for (var s = 0; s < comp.length; s++) {
      var dice = comp[s].split('d');
      if (dice.length > 1)
        for (var d = 0; d < dice[0]; d++) {
          value.push(Math.floor(Math.random() * parseInt(dice[1]) + 1));
        }
      else value[0] += parseInt(dice);
    }
    return value;
  }

  crit(str) {
    var value = 0;
    var comp = str.split('+');
    for (var s = 0; s < comp.length; s++)
      value +=
        comp[s].split('d').length > 1
          ? parseInt(comp[s].split('d')[0]) * parseInt(comp[s].split('d')[1])
          : parseInt(comp[s].split('d'));
    return value;
  }

  displayHit(data) {
    var attacks = new Set();
    for (var d = 0; d < data.length; d++)
      for (var a = 0; a < data[d].toHit.length; a++)
        attacks.add(data[d].toHit[a].hit);
    return Array.from(attacks).sort().join(', ');
  }

  hit(sword, crit = false) {
    const { str, cha, initLvl, inferno } = this.state.charStats;
    const { type, dr, resist, immune } = this.state.enemyStats;
    var damage = {};
    var amount, roll, _roll, r;
    var log = crit ? '- CRITICAL!' : '- Damage';

    // base
    var _str =
      (sword.active == 'Hand' || sword.active == 'Off-Hand') *
      Math.floor(
        Math.floor(str / 2 - 5) / (1 + 1 * (sword.active == 'Off-Hand'))
      );
    var _roll = `${
      sword.baseDamage[Object.getOwnPropertyNames(sword.baseDamage)[0]]
    }+${
      sword.enhanceBonus +
      _str +
      crit *
        this.crit(
          `${
            sword.baseDamage[Object.getOwnPropertyNames(sword.baseDamage)[0]]
          }+${sword.enhanceBonus + _str}`
        )
    }`;
    roll = this.roll(_roll);

    if (roll.length > 1 || roll[0] != 0) {
      log += `; BaseSword[${_roll}]: (`;
      for (r = 0; r < roll.length; r++) {
        log +=
          (r + 1) % roll.length == 0
            ? `)${
                roll[(r + 1) % roll.length] != 0
                  ? `+${roll[(r + 1) % roll.length]}`
                  : ''
              }`
            : `${r > 0 ? ', ' : ''}${roll[(r + 1) % roll.length]}`;
      }
      log += ` ${Object.getOwnPropertyNames(sword.baseDamage)[0]}`;
    }

    amount = roll.reduce((a, b) => a + b, 0);
    if (amount > 0)
      if (!!damage[Object.getOwnPropertyNames(sword.baseDamage)[0]])
        damage[Object.getOwnPropertyNames(sword.baseDamage)[0]] += amount;
      else
        Object.assign(
          damage,
          JSON.parse(
            `{"${Object.getOwnPropertyNames(sword.baseDamage)[0]}":${amount}}`
          )
        );

    // crystal
    var crystal = this.weaponModifiers(
      Object.getOwnPropertyNames(sword.crystal)[0],
      sword.crystal[Object.getOwnPropertyNames(sword.crystal)[0]],
      Object.getOwnPropertyNames(sword.baseDamage)[0]
    );
    _roll =
      crystal[
        (type == crystal.against ? 'true' : '') + (crit ? 'Crit' : '') ||
          'amount'
      ];
    roll = this.roll(_roll);

    if (roll.length > 1 || roll[0] != 0) {
      log += `; Witchlight(${
        sword.crystal[Object.getOwnPropertyNames(sword.crystal)[0]]
      })[${_roll}]: (`;
      for (r = 0; r < roll.length; r++) {
        log +=
          (r + 1) % roll.length == 0
            ? `)${
                roll[(r + 1) % roll.length] != 0
                  ? `+${roll[(r + 1) % roll.length]}`
                  : ''
              }`
            : `${r > 0 ? ', ' : ''}${roll[(r + 1) % roll.length]}`;
      }
      log += ` ${crystal.type}`;
    }

    amount = roll.reduce((a, b) => a + b, 0);
    if (amount > 0)
      if (!!damage[crystal.type]) damage[crystal.type] += amount;
      else Object.assign(damage, JSON.parse(`{"${crystal.type}":${amount}}`));

    // enchantments
    var enchants = Object.getOwnPropertyNames(sword.enchantments);
    for (var e = 0; e < enchants.length; e++) {
      var data = this.weaponModifiers(
        enchants[e],
        null,
        Object.getOwnPropertyNames(sword.baseDamage)[0]
      );
      if (!!data.type) {
        // if enchantment adds damage to the hit
        _roll = [
          ...(crit
            ? data.crit.split('crit:').join(`${sword.critAmount}`)
            : data.amount
          )
            .split('+')
            .map((roll_) => {
              return roll_.split('d').length > 1
                ? `${eval(roll_.split('d')[0])}d${roll_.split('d')[1]}`
                : roll_;
            }),
        ].join('+');
        roll = this.roll(_roll);

        if (roll.length > 1 || roll[0] != 0) {
          log += `; ${enchants[e]}[${_roll}]: `;
          for (r = 0; r < roll.length; r++) {
            if (roll.length > 1)
              log +=
                (r + 1) % roll.length == 0
                  ? `)${
                      roll[(r + 1) % roll.length] != 0
                        ? `+${roll[(r + 1) % roll.length]}`
                        : ''
                    }`
                  : `${r > 0 ? ', ' : '('}${roll[(r + 1) % roll.length]}`;
            else log += `${roll[(r + 1) % roll.length]}`;
          }
          log += ` ${data.type}`;
        }

        amount = roll.reduce((a, b) => a + b, 0);
        if (amount > 0)
          if (!!damage[data.type]) damage[data.type] += amount;
          else Object.assign(damage, JSON.parse(`{"${data.type}":${amount}}`));
      }
    }

    // boosts
    if (inferno) {
      // inferno blade
      roll = this.roll(`3d6+${initLvl + crit * this.crit(`3d6+${initLvl}`)}`);

      log += `; InfernoBlade[3d6 + ${
        initLvl + crit * this.crit(`3d6+${initLvl}`)
      }]: `;
      for (r = 0; r < roll.length; r++) {
        if (roll.length > 1)
          log +=
            (r + 1) % roll.length == 0
              ? `)${
                  roll[(r + 1) % roll.length] != 0
                    ? `+${roll[(r + 1) % roll.length]}`
                    : ''
                }`
              : `${r > 0 ? ', ' : '('}${roll[(r + 1) % roll.length]}`;
        else log += `${roll[(r + 1) % roll.length]}`;
      }
      log += ` fire`;

      amount = roll.reduce((a, b) => a + b, 0);
      if (amount > 0)
        if (!!damage['fire']) damage['fire'] += amount;
        else Object.assign(damage, JSON.parse(`{"fire":${amount}}`));
    }

    // items
    var gloves = Math.max(Math.floor(cha / 2 - 5), 1) * (1 + 1 * crit);
    log += `; Gauntlets of Heartfelt Blows[charisma min 1]: ${gloves} fire`;
    if (!!damage['fire']) damage['fire'] += gloves;
    else Object.assign(damage, JSON.parse(`{"fire":${gloves}}`));

    return { log: log, damage: damage };
  }

  weaponModifiers(name, sub = null, base = 'base') {
    const index = {
      Flaming: { type: 'fire', amount: '1d6', crit: '1d6+6', bonus: 1 },
      Frost: { type: 'cold', amount: '1d6', crit: '1d6+6', bonus: 1 },
      Shock: { type: 'electricity', amount: '1d6', crit: '1d6+6', bonus: 1 },
      Defending: { type: null, bonus: 1 },
      GhostTouch: { type: null, bonus: 1 },
      Bane: { type: base, amount: '2d6+2', crit: '2d6+16', bonus: 1 },
      Wounding: { type: 'wounded', amount: '1', crit: '1', bonus: 1 },
      Flying: { type: null, bonus: 1 },
      IcyBurst: {
        type: 'cold',
        amount: '1d6',
        crit: 'crit:-1d10+1d6+6',
        bonus: 2,
      },
      FlamingBurst: {
        type: 'fire',
        amount: '1d6',
        crit: 'crit:-1d10+1d6+6',
        bonus: 2,
      },
      ShockingBurst: {
        type: 'electricity',
        amount: '1d6',
        crit: 'crit:-1d10+1d6+6',
        bonus: 2,
      },
      Thundering: { type: 'sonic', amount: '0', crit: 'crit:-1d8', bonus: 2 },
      Disruption: { type: null, bonus: 2 },
      Souldrinking: {
        type: 'negativelevels',
        amount: '1',
        crit: '2',
        bonus: 4,
      },
      Dancing: { type: null, bonus: 4 },
      Speed: { type: null, bonus: 4 },
      Everdancing: { type: null, bonus: 8 },
      Witchlight: {
        Sunlight: {
          type: 'fire',
          against: 'undead',
          amount: '2d6',
          true: '4d6',
          Crit: '2d6+12',
          trueCrit: '4d6+24',
        },
        Moonlight: {
          type: 'electricity',
          against: 'lycanthrope',
          amount: '2d6',
          true: '4d6',
          Crit: '2d6+12',
          trueCrit: '4d6+24',
        },
        Blood: {
          type: base,
          against: 'living',
          amount: '0',
          true: '2d6',
          Crit: '0',
          trueCrit: '2d6+12',
        },
      },
    };

    return sub
      ? !!index[name][sub]
        ? index[name][sub]
        : { type: null }
      : !!index[name]
      ? index[name]
      : { type: null };
  }

  render() {
    const {
      swords,
      turn,
      showSwords,
      charStats,
      toHit,
      enemyStats,
      log,
      damage,
      ememies,
      showLogs,
      showLogDetailed,
    } = this.state;
    const {
      str,
      dex,
      cha,
      initLvl,
      hit,
      tumble,
      hasted,
      growth,
      inferno,
      belt,
    } = charStats;
    const { ac, dr, resist } = enemyStats;
    var _damage = { total: 0 };

    return (
      <div className="form">
        <Form onSubmit={(e) => e.preventDefault()}>
          <Form.Row>
            <Form.Group className="sm-10">
              <Form.Label>Round</Form.Label>
              <Form.Control
                value={turn}
                type="number"
                onChange={(e) => {
                  this.setState({ turn: e.target.value });
                }}
              />
            </Form.Group>
            <Form.Group
              className="sm-5"
              onClick={() => {
                this.setState({
                  charStats: Object.assign(charStats, { hasted: !hasted }),
                });
              }}
            >
              <Form.Label>Hasted?</Form.Label>
              <Form.Check type="switch" checked={hasted} />
            </Form.Group>
            <Form.Group
              className="sm-5"
              onClick={() => {
                this.setState({
                  charStats: Object.assign(charStats, { growth: !growth }),
                });
              }}
            >
              <Form.Label>Ring of Growth</Form.Label>
              <Form.Check type="switch" checked={growth} />
            </Form.Group>
            <Form.Group
              className="sm-5"
              onClick={() => {
                this.setState({
                  charStats: Object.assign(charStats, { inferno: !inferno }),
                });
              }}
            >
              <Form.Label>Inferno Blade</Form.Label>
              <Form.Check type="switch" checked={inferno} />
            </Form.Group>
            <Form.Group
              className="sm-5"
              onClick={() => {
                this.setState({
                  charStats: Object.assign(charStats, { belt: !belt }),
                });
              }}
            >
              <Form.Label>Belt of Battle</Form.Label>
              <Form.Check type="switch" checked={belt} />
            </Form.Group>
            <Form.Group className="sm-10">
              <Form.Label>Dexterity</Form.Label>
              <Form.Control
                value={dex}
                type="number"
                onChange={(e) => {
                  this.setState({
                    charStats: Object.assign(charStats, {
                      dex: e.target.value,
                    }),
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="sm-10">
              <Form.Label>Strength</Form.Label>
              <Form.Control
                value={str}
                type="number"
                onChange={(e) => {
                  this.setState({
                    charStats: Object.assign(charStats, {
                      str: e.target.value,
                    }),
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="sm-10">
              <Form.Label>Charisma</Form.Label>
              <Form.Control
                value={cha}
                type="number"
                onChange={(e) => {
                  this.setState({
                    charStats: Object.assign(charStats, {
                      cha: e.target.value,
                    }),
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="sm-10">
              <Form.Label>Initiator Level</Form.Label>
              <Form.Control
                value={initLvl}
                type="number"
                onChange={(e) => {
                  this.setState({
                    charStats: Object.assign(charStats, {
                      initLvl: e.target.value,
                    }),
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="sm-10">
              <Form.Label>Base To-Hit</Form.Label>
              <Form.Control
                value={hit}
                type="number"
                onChange={(e) => {
                  this.setState({
                    charStats: Object.assign(charStats, {
                      hit: e.target.value,
                    }),
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="sm-10">
              <Form.Label>Tumble</Form.Label>
              <Form.Control
                value={tumble}
                type="number"
                onChange={(e) => {
                  this.setState({
                    charStats: Object.assign(charStats, {
                      tumble: e.target.value,
                    }),
                  });
                }}
              />
            </Form.Group>
          </Form.Row>
          <Button onClick={() => this.attack('dancing')}>Dancing Attack</Button>
          <Button onClick={() => this.attack('opportunity')}>
            Opportunity Attack
          </Button>
          <Button onClick={() => this.attack('full')}>Full Round Attack</Button>
          <hr />
          <Form.Row>
            <Form.Group className="sm-10">
              <Form.Label>Enemies</Form.Label>
              <Form.Control
                value={ememies}
                type="number"
                onChange={(e) => {
                  this.setState({ ememies: e.target.value });
                }}
              />
            </Form.Group>
            <Form.Group className="sm-10">
              <Form.Label>Through:</Form.Label>
              <Form.Row>
                <Button onClick={() => this.tumble('through-half')}>
                  Half
                </Button>
                <Button onClick={() => this.tumble('through-full')}>
                  Full
                </Button>
              </Form.Row>
            </Form.Group>
            <Form.Group>
              <Form.Label>Around:</Form.Label>
              <Form.Row>
                <Button onClick={() => this.tumble('around-half')}>Half</Button>
                <Button onClick={() => this.tumble('around-full')}>Full</Button>
              </Form.Row>
            </Form.Group>
          </Form.Row>
          <hr />
          <Collapse in={toHit.length > 0}>
            <div>
              <div>{this.displayHit(toHit)}</div>
              <Form>
                <Form.Group>
                  <Form.Label>Hit @</Form.Label>
                  <Form.Control
                    value={ac}
                    type="number"
                    onChange={(e) => {
                      this.setState({
                        enemyStats: Object.assign(enemyStats, {
                          ac: e.target.value,
                        }),
                      });
                    }}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>DR</Form.Label>
                  <Form.Control
                    value={dr}
                    type="number"
                    onChange={(e) => {
                      this.setState({
                        enemyStats: Object.assign(enemyStats, {
                          dr: e.target.value,
                        }),
                      });
                    }}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Resistances</Form.Label>
                  <Form.Control
                    value={resist}
                    type="number"
                    onChange={(e) => {
                      this.setState({ turn: e.target.value });
                    }}
                  />
                </Form.Group>
                <Button onClick={this.damage}>Attack</Button>
              </Form>
              <hr />
            </div>
          </Collapse>
          <Button onClick={() => this.setState({ showSwords: !showSwords })}>
            {showSwords ? 'Hide' : 'Show'} Swords
          </Button>
          <Button
            disabled={Object.getOwnPropertyNames(log) == 0}
            onClick={() => this.setState({ showLogs: !showLogs })}
          >
            {showLogs ? 'Hide' : 'Show'} Logs
          </Button>
        </Form>
        <Collapse in={showLogs}>
          <div>
            {' '}
            <hr />
            {Object.getOwnPropertyNames(log).map((value) => {
              switch (value) {
                case 'tumble':
                  return (
                    <>
                      <Card>
                        <Card.Header
                          onClick={() =>
                            this.setState({ showLogDetailed: !showLogDetailed })
                          }
                        >
                          Failed: {log[value].fails.length}, Passed:{' '}
                          {log[value].passes.length}
                        </Card.Header>
                        <Collapse in={showLogDetailed}>
                          <div>
                            <Card.Body>
                              <Row>
                                <Col>
                                  <div>Failed Log:</div>
                                  {log[value].fails.map((info) => {
                                    return <div>{info}</div>;
                                  })}
                                </Col>
                                <Col>
                                  <div>Passed Log:</div>
                                  {log[value].passes.map((info) => {
                                    return <div>{info}</div>;
                                  })}
                                </Col>
                              </Row>
                            </Card.Body>
                          </div>
                        </Collapse>
                      </Card>
                    </>
                  );
                case 'damage':
                  return (
                    <>
                      <Card>
                        <Card.Header
                          onClick={() =>
                            this.setState({ showLogDetailed: !showLogDetailed })
                          }
                        >
                          Total:
                          {Object.getOwnPropertyNames(damage).map((value) => {
                            if (value == 'negativelevels' || value == 'wounded')
                              Object.assign(
                                _damage,
                                JSON.parse(`{"${value}":${damage[value]}}`)
                              );
                            else _damage.total += damage[value];
                          })}
                          {Object.getOwnPropertyNames(_damage).map((value) => {
                            return `${value == 'total' ? '' : `, ${value}:`} ${
                              _damage[value]
                            }`;
                          })}
                        </Card.Header>
                        <Collapse in={showLogDetailed}>
                          <div>
                            <Card.Body>
                              {log[value].map((info) => {
                                return <div>{info}</div>;
                              })}
                            </Card.Body>
                          </div>
                        </Collapse>
                        <Card.Footer
                          onClick={() =>
                            this.setState({ showLogDetailed: !showLogDetailed })
                          }
                        >
                          {Object.getOwnPropertyNames(damage).map(
                            (value, index) => {
                              return `${index == 0 ? '' : ', '}${value}: ${
                                damage[value]
                              }`;
                            }
                          )}
                        </Card.Footer>
                      </Card>
                    </>
                  );
              }
            })}
          </div>
        </Collapse>
        <Collapse in={showSwords}>
          <div>
            <hr />
            {swords.map((sword, index) => {
              return (
                <SwordCard
                  key={`sword${index} `}
                  inuse={this.usedEnchants()}
                  data={sword}
                  index={index}
                  currentTurn={turn}
                  updateSword={this.updateSword}
                />
              );
            })}
          </div>
        </Collapse>
      </div>
    );
  }
}

export default App;
