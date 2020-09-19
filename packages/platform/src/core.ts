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

import { Resource, identify, AnyPlugin } from './platform'
import { CombineObjects, KeysByType } from 'simplytyped'

type MethodType = (...args: any[]) => any

type PrimitiveType = number | string | undefined

export type Property<P extends PrimitiveType, T> = P & { __property: T }
export type Ref<T extends Doc> = string & { __ref: T } & Resource<T>
export type Method<T extends MethodType> = T & { __method: T } & Resource<T>

export interface Obj {
  _class: Ref<Class<Obj>>
}

export interface Emb extends Obj {
  __embedded: true
}

export interface Doc extends Obj {
  _class: Ref<Class<Doc>>
  _id: Ref<Doc>
  _mixins?: Ref<Mixin<Doc>>[]
}

export type PropertyType = Property<PrimitiveType, any>
  | Resource<any>
  | Emb
  | PropertyType[]
  | { [key: string]: PropertyType }

export type StringProperty = Property<string, string>

export interface Type extends Emb {
  _default?: PropertyType
}

export interface Attribute extends Emb {
  type: Type
}

export type Attributes<T extends E, E extends Obj> = Record<Exclude<keyof T, keyof E>, Attribute>
export type AllAttributes<T extends E, E extends Obj> = Required<Attributes<T, E>> & Partial<Attributes<E, Obj>>

export enum ClassifierKind {
  CLASS,
  MIXIN
}

export interface EClassifier<T extends E, E extends Obj> extends Doc {
  _kind: ClassifierKind
  _attributes: AllAttributes<T, E>
  _extends?: Ref<Classifier<E>>
}

export type Classifier<T extends Obj> = EClassifier<T, Obj>

export interface EMixin<T extends E, E extends Obj> extends EClass<T, E> { }

export type Mixin<T extends Obj> = EMixin<T, Obj>

export interface EClass<T extends E, E extends Obj> extends EClassifier<T, E> {
  _native?: Resource<Object>
  _domain?: StringProperty
}

export type Class<T extends Obj> = EClass<T, Obj>

// T Y P E S

export interface RefTo<T extends Doc> extends Type {
  to: Ref<Class<T>>
}

export interface InstanceOf<T extends Emb> extends Type {
  of: Ref<Class<T>>
}

export interface BagOf<A> extends Type {
  of: Type
}

export interface ArrayOf<A> extends Type {
  of: Type
}

// S P A C E S

export interface Space extends Doc {
  title: StringProperty
}

// T R A N S A C T I O N S

export type DateProperty = Property<number, Date>

export interface VDoc extends Doc {
  _space: Ref<Space>
  _createdOn: DateProperty
  _createdBy: StringProperty
  _modifiedOn?: DateProperty
  _modifiedBy?: StringProperty
}

export interface Indices extends Class<VDoc> {
  primary: StringProperty
}

export interface Title extends Doc {
  _objectClass: Ref<Classifier<Doc>>
  _objectId: Ref<Doc>
  title: string | number
}

export interface Tx extends Doc {
  _date: DateProperty
  _user: StringProperty
  _objectId: Ref<VDoc>
  _objectClass: Ref<Class<VDoc>>
}

export interface CreateTx extends Tx {
  _space: Ref<Space>
  _attributes: { [key: string]: PropertyType }
}

export interface PushTx extends Tx {
  _attribute: StringProperty
  _attributes: { [key: string]: PropertyType }
}

export interface UpdateTx extends Tx {
  _attributes: { [key: string]: any }
}

export interface DeleteTx extends Tx {
}

export type OptionalMethods<T extends object> = CombineObjects<Omit<T, KeysByType<T, MethodType>>,
  Partial<Pick<T, KeysByType<T, MethodType>>>>

export interface AnyLayout {
  [key: string]: PropertyType
}

export enum CoreDomain {
  Model = 'model',
  Tx = 'tx',
  Title = 'title'
}

// TODO: I really hate to have this here, but `server` in not platform (plugin) based, so we share ids this way.
export const core = identify('core' as AnyPlugin, {
  class: {
    Title: '' as Ref<Class<Title>>,
    CreateTx: '' as Ref<Class<CreateTx>>,
    PushTx: '' as Ref<Class<PushTx>>,
    UpdateTx: '' as Ref<Class<UpdateTx>>,
    DeleteTx: '' as Ref<Class<DeleteTx>>
  },
  mixin: {
    Indices: '' as Ref<Mixin<Indices>>,
  }
})
