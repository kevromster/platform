//
// Copyright © 2020 Anticrm Platform Contributors.
// 
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// 
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { AnyLayout, Class, CORE_CLASS_SPACE, Doc, Ref, Space, Storage, Tx } from '@anticrm/core'
import { MongoStorage } from './mongo'

export class SpaceStorage implements Storage {
  private proxyStorage: MongoStorage
  private currentUserAccount: string

  // Map of spaces of the current user.
  // Key - space Id, value - set of user accounts included in the space.
  private userSpaces: Map<Ref<Space>, Set<string>> = new Map<Ref<Space>, Set<string>>()

  constructor (currentUserAccount: string, store: MongoStorage) {
    this.proxyStorage = store
    this.currentUserAccount = currentUserAccount
  }

  // TODO: not need this initialization after implementing lazy cache
  async initUserSpacesCache () {
    const spaces = await this.find(CORE_CLASS_SPACE, { _id: { $in: await this.getUserSpaces(this.currentUserAccount) }})

    for (const space of spaces) {
      this.onAddNewSpace(space)
    }
  }

  store (doc: Space): Promise<void> {
    this.onAddNewSpace(doc)

    // TODO: now assume that insertion to the store is always successful;
    // need to revert back 'userSpaces' cache change if failed to insert the object
    return this.proxyStorage.store(doc)
  }

  push (_class: Ref<Class<Doc>>, _id: Ref<Space>, attribute: string, attributes: any): Promise<void> {
    if (attribute === 'users') {
      const userToAdd = attributes

      // currently accept only string value for 'users' attribute
      if (typeof userToAdd !== 'string') {
        throw new Error(`Bad attributes to be pushed to 'users' collection of the space`)
      }

      this.onAddNewUserToSpace(_id, userToAdd)
    }

    return this.proxyStorage.push(_class, _id, attribute, attributes)
  }

  update (_class: Ref<Class<Doc>>, selector: object, attributes: any): Promise<void> {
    if ('users' in attributes) {
      const newSpaceUsers = attributes['users']

      // expect only array of users here
      if (!Array.isArray(newSpaceUsers)) {
        throw new Error(`Bad attributes to be updated for 'users' collection of the space`)
      }

      this.onReplaceUsersInSpace((selector as any)._id as Ref<Space>, newSpaceUsers)
    }

    return this.proxyStorage.update(_class, selector, attributes)
  }

  remove (_class: Ref<Class<Doc>>, _id: Ref<Doc>): Promise<void> {
    // TODO: update cache
    return this.proxyStorage.remove(_class, _id)
  }

  find<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout, options?: AnyLayout): Promise<T[]> {
    // TODO: initialize cache like in initUserSpacesCache() if it is not yet initialized or obsolete
    return this.proxyStorage.find(_class, query, options)
  }

  findOne<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout, options?: AnyLayout): Promise<T|null> {
    // TODO: initialize cache like in initUserSpacesCache() if it is not yet initialized or obsolete
    return this.proxyStorage.findOne(_class, query, options)
  }

  /**
   * Gets Ids of spaces that the given user account has access to.
   *
   * @param userAccount the user account to get spaces for
   * @returns the list of space Ids
   */
  // TODO: implement cache for this method
  async getUserSpaces (userAccount: string): Promise<Ref<Space>[]> {
    if (!userAccount || userAccount.length == 0) {
      return []
    }

    const usersQuery = { users: { $elemMatch: { $eq: userAccount }}} as unknown as AnyLayout
    const getOnlyIdsOption = { projection: { _id: true }} as unknown as AnyLayout
    const spaces: Space[] = await this.find(CORE_CLASS_SPACE, usersQuery, getOnlyIdsOption)

    // pass null and undefined here to obtain documents not assigned to any space
    // TODO: remove 'General' and 'Random' when implement public spaces concept
    let userSpaceIds = [
      null as unknown as Ref<Space>,
      undefined as unknown as Ref<Space>,
      'space:workbench.General' as Ref<Space>,
      'space:workbench.Random' as Ref<Space>
    ]

    for (const space of spaces) {
      userSpaceIds.push(space._id as Ref<Space>)
    }

    return userSpaceIds
  }

  /**
   * Gets list of user accounts that have access to the given space.
   *
   * @param space the space Id to ge list of user account for
   * @returns the list of related user accounts
   */
  // TODO: implement cache for this method
  async getSpaceUsers (space: Ref<Space>): Promise<string[]> {
    const getOnlyUsersOption = { projection: { users: true }} as unknown as AnyLayout
    const doc = await this.findOne(CORE_CLASS_SPACE, { _id: space }, getOnlyUsersOption)
    return doc && doc.users ? doc.users : []
  }

  /**
   * Gets space Id of the given object.
   *
   * @param _class the object's class
   * @param _id the object's Id
   * @returns the space Id that the object belongs to
   */
  async getObjectSpace (_class: Ref<Class<Doc>>, _id: Ref<Doc>): Promise<Ref<Space>> {
    if (_class === CORE_CLASS_SPACE) {
      return _id as Ref<Space>
    }

    const getOnlySpaceOption = { projection: { _space: true }} as unknown as AnyLayout
    const doc = await this.findOne(_class, { _id }, getOnlySpaceOption)
    return doc ? (doc as any)._space : null
  }

  /**
   * Should be called when the current user account has been added into a new space by another user.
   *
   * @param space the space the current user added to
   */
  onCurrentUserAddedToNewSpace (space: Ref<Space>) {
     if (!this.userSpaces.has(space)) {
      this.userSpaces.set(space, new Set<string>([this.currentUserAccount]))
      // TODO: need update/mark dirty all cache for that space

      // request for getting full list of users in the space
      this.find(CORE_CLASS_SPACE, { _id: space }).then(spaces => {
        if (spaces && spaces.length > 0 && spaces[0].users) {
          for (const user of spaces[0].users) {
            this.onAddNewUserToSpace(space, user)
          }
        }
      })
    }
  }

  // TODO: remove this after implementinc public spaces concept
  private isPublicSpace (space: Space): boolean {
    return !space._id || space._id === 'space:workbench.General' || space._id === 'space:workbench.Random'
  }

  private onAddNewSpace (spaceToBeCreated: Space) {
    const spaceUsers = new Set<string>(spaceToBeCreated.users ?? [])

    if (spaceUsers.has(this.currentUserAccount) || this.isPublicSpace(spaceToBeCreated)) {
      this.userSpaces.set(spaceToBeCreated._id as Ref<Space>, spaceUsers)
    }
  }

  private onAddNewUserToSpace (spaceToBeUpdated: Ref<Space>, newUser: string) {
    if (!this.userSpaces.has(spaceToBeUpdated)) {
      // smth strange if we are here: user rights are checked in the upper code
      throw new Error(`The account '${this.currentUserAccount}' wanted to change space '${spaceToBeUpdated}' without having rights to do so`)
    }

    this.userSpaces.get(spaceToBeUpdated)?.add(newUser)
  }

  private onReplaceUsersInSpace (spaceToBeUpdated: Ref<Space>, newSpaceUsers: string[]) {
    const newSpaceUsersSet = new Set<string>(newSpaceUsers)

    if (!this.userSpaces.has(spaceToBeUpdated)) {
      // smth strange if we are here: user rights are checked in the upper code
      throw new Error(`The account '${this.currentUserAccount}' wanted to change space '${spaceToBeUpdated}' without having rights to do so`)
    }

    if (newSpaceUsersSet.has(this.currentUserAccount)) {
      this.userSpaces.set(spaceToBeUpdated, newSpaceUsersSet)
    } else {
      // the current user is no longer in space, remove space from cache
      this.userSpaces.delete(spaceToBeUpdated)
    }
  }
}
