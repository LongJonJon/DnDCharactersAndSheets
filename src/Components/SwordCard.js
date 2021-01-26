import React, { Component } from 'react';

import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Collapse from 'react-bootstrap/Collapse';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import weaponEnchantsInfo from '../dndInfo/weaponEnchantsInfo.json';

class SwordCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      enchants: this.props.data.enchantments,
    };
    this.change = this.change.bind(this);
  }

  change(e) {
    e.preventDefault();
  }

  enchantmentBonus(name) {
    const index = {
      Flaming: 1,
      Frost: 1,
      Shock: 1,
      Defending: 1,
      GhostTouch: 1,
      Bane: 1,
      Wounding: 1,
      Flying: 1,
      IcyBurst: 2,
      FlamingBurst: 2,
      ShockingBurst: 2,
      Thundering: 2,
      Disruption: 2,
      Souldrinking: 4,
      Dancing: 4,
      Speed: 4,
      Everdancing: 8,
      Spellblade: 0,
      Spellstrike: 1,
      Sizing: 1,
      Initiative: 0,
      Agility: 0,
    };

    return !!index[name] ? index[name] : 0;
  }

  getEffective(sword) {
    if (
      sword.enhanceBonus > 0 ||
      Object.getOwnPropertyNames(sword.enchantments).length > 0
    )
      return ` (+${
        sword.enhanceBonus +
        Object.getOwnPropertyNames(sword.enchantments).reduce(
          (a, name) => a + this.enchantmentBonus(name),
          0
        )
      })`;
    return '';
  }

  render() {
    const { show, enchants } = this.state;
    const { data, index, updateSword, currentTurn, inuse } = this.props;
    const { enchantments, active, critRange, turn } = data;
    const enBlade = {
      'Enchanted Blade 1': [
        'Defending',
        'Flaming',
        'Frost',
        'Shock',
        'GhostTouch',
      ],
      'Enchanted Blade 2': [
        'Bane',
        'Disruption',
        'FlamingBurst',
        'IcyBurst',
        'ShockingBurst',
        'Thundering',
        'Wounding',
      ],
      'Enchanted Blade 3': ['Dancing', 'Flying', 'Passage', 'Speed'],
    };

    if (!!turn && currentTurn - turn >= 4 && currentTurn - turn < 8)
      updateSword(`${index}-active`, '');

    return (
      <Card>
        <Card.Header onClick={() => this.setState({ show: !show })}>
          {active != ''
            ? active
            : !!turn && currentTurn - turn >= 0 && currentTurn - turn < 8
            ? 'Resting'
            : ''}{' '}
          Adamantine Witchlight Wakazashi{this.getEffective(data)}
          {Object.getOwnPropertyNames(enchantments).length > 0 &&
            `, (${Object.getOwnPropertyNames(enchantments).join(', ')})`}
        </Card.Header>
        <Collapse in={show}>
          <Card.Body>
            <Form onSubmit={(e) => e.preventDefault()}>
              <Form.Group>
                <Form.Label>Round Stats</Form.Label>
                <Form.Row>
                  <Form.Check
                    checked={active == ''}
                    type="radio"
                    label="Sheathed"
                    id={`${index}-active-S`}
                    onClick={(e) => updateSword(e.target.id, '')}
                    onChange={(e) => this.change(e)}
                  />
                  <Form.Check
                    checked={active == 'Hand'}
                    type="radio"
                    label="Hand"
                    id={`${index}-active-H`}
                    onClick={(e) => updateSword(e.target.id, 'Hand')}
                    onChange={(e) => this.change(e)}
                  />
                  <Form.Check
                    checked={active == 'Off-Hand'}
                    type="radio"
                    label="Off-Hand"
                    id={`${index}-active-O`}
                    onClick={(e) => updateSword(e.target.id, 'Off-Hand')}
                    onChange={(e) => this.change(e)}
                  />
                  {!!enchants.Everdancing && (
                    <Form.Check
                      checked={active == 'Everdancing'}
                      type="radio"
                      label="Everdancing"
                      id={`${index}-active-D`}
                      onClick={(e) => updateSword(e.target.id, 'Everdancing')}
                      onChange={(e) => this.change(e)}
                    />
                  )}
                  {!!enchants.Dancing && (
                    <>
                      <Form.Group className="sm-10">
                        <Form.Control
                          value={!!turn ? turn : ''}
                          id={`${index}-turn`}
                          type="number"
                          onChange={(e) =>
                            updateSword(e.target.id, e.target.value)
                          }
                        />
                      </Form.Group>{' '}
                      Dancing
                    </>
                  )}
                </Form.Row>
              </Form.Group>
              <hr />
              <Form.Group>
                <Form.Label>Sword Stats</Form.Label>
                <div>
                  Crystal: Witchlight ({data.crystal.Witchlight})
                  <Form>
                    <Form.Control
                      id={`${index}-Witchlight`}
                      defaultValue={data.crystal.Witchlight}
                      size="sm"
                      as="select"
                      onChange={(e) => updateSword(e.target.id, e.target.value)}
                    >
                      <option value="Sunlight">
                        Sunlight (2d6 fire, 4d6 against undead)
                      </option>
                      <option value="Moonlight">
                        Moonlight (2d6 electricity, 4d6 against lycanthrope)
                      </option>
                      <option value="Blood">Blood (2d6 against living)</option>
                    </Form.Control>
                  </Form>
                </div>
                <div>Base Damage: 1d6+1 Slashing</div>
                <div>Crit Range: ({critRange}-20)x2</div>
              </Form.Group>
              <hr />
              <Form.Group>
                <Form.Label>Base Weapon Enchants</Form.Label>
                <Form.Row>
                  {['Souldrinking', 'Everdancing'].map((_enchant) => {
                    return (
                      <OverlayTrigger
                        key={`tooltip-${index}-${_enchant}`}
                        placement="top"
                        overlay={
                          <Tooltip id={`tooltip-${index}-${_enchant}`}>
                            {!!weaponEnchantsInfo[_enchant] ? (
                              weaponEnchantsInfo[_enchant]
                            ) : (
                              <>
                                Info for <strong>{_enchant}</strong> has not
                                been found or added yet
                              </>
                            )}
                          </Tooltip>
                        }
                      >
                        <div>
                          <Form.Check
                            type="switch"
                            label={_enchant}
                            checked={!!enchants[_enchant]}
                            id={`${index}-${_enchant}`}
                            onClick={(e) =>
                              updateSword(e.target.id, !enchants[_enchant])
                            }
                            onChange={(e) => this.change(e)}
                          />
                        </div>
                      </OverlayTrigger>
                    );
                  })}
                </Form.Row>
                <Form.Row>
                  {[
                    'Spellblade',
                    'Spellstrike',
                    'Sizing',
                    'Initiative',
                    'Agility',
                  ].map((_enchant) => {
                    return (
                      <OverlayTrigger
                        key={`tooltip-${index}-${_enchant}`}
                        placement="top"
                        overlay={
                          <Tooltip id={`tooltip-${index}-${_enchant}`}>
                            {!!weaponEnchantsInfo[_enchant] ? (
                              weaponEnchantsInfo[_enchant]
                            ) : (
                              <>
                                Info for <strong>{_enchant}</strong> has not
                                been found or added yet
                              </>
                            )}
                          </Tooltip>
                        }
                      >
                        <div>
                          <Form.Check
                            type="switch"
                            label={_enchant}
                            checked={!!enchants[_enchant]}
                            id={`${index}-${_enchant}`}
                            onClick={(e) =>
                              updateSword(e.target.id, !enchants[_enchant])
                            }
                            onChange={(e) => this.change(e)}
                          />
                        </div>
                      </OverlayTrigger>
                    );
                  })}
                </Form.Row>
              </Form.Group>
              {Object.getOwnPropertyNames(enBlade).map((catagory) => {
                return (
                  <>
                    <hr />
                    <Form.Group>
                      <Form.Label>{catagory}</Form.Label>
                      <Form.Row>
                        {enBlade[catagory].map((_enchant) => {
                          return (
                            <OverlayTrigger
                              key={`tooltip-${index}-${_enchant}`}
                              placement="top"
                              overlay={
                                <Tooltip id={`tooltip-${index}-${_enchant}`}>
                                  {!!weaponEnchantsInfo[_enchant] ? (
                                    weaponEnchantsInfo[_enchant]
                                  ) : (
                                    <>
                                      Info for <strong>{_enchant}</strong> has
                                      not been found or added yet
                                    </>
                                  )}
                                </Tooltip>
                              }
                            >
                              <div>
                                <Form.Check
                                  type="switch"
                                  disabled={
                                    inuse.has(_enchant) && !enchants[_enchant]
                                  }
                                  label={_enchant}
                                  checked={!!enchants[_enchant]}
                                  id={`${index}-${_enchant}`}
                                  onClick={(e) =>
                                    updateSword(
                                      e.target.id,
                                      !enchants[_enchant]
                                    )
                                  }
                                  onChange={(e) => this.change(e)}
                                />
                              </div>
                            </OverlayTrigger>
                          );
                        })}
                      </Form.Row>
                    </Form.Group>
                  </>
                );
              })}
            </Form>
          </Card.Body>
        </Collapse>
      </Card>
    );
  }
}

export default SwordCard;
