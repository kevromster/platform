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

import Builder from './builder'
import { ClassifierKind, CoreDomain, EasyScript } from '@anticrm/platform'
import core from '.'

export { Builder }

export default (S: Builder) => {
  S.createDocument(core.class.Class, {
    _kind: ClassifierKind.CLASS,
    _attributes: {}
  }, core.class.Obj)

  S.createDocument(core.class.Class, {
    _kind: ClassifierKind.CLASS,
    _extends: core.class.Obj,
    _attributes: {}
  }, core.class.Emb)

  S.createClass(core.class.Doc, core.class.Obj, {
    _id: S.attr(core.class.RefTo, {
      to: core.class.Doc
    }),
    _mixins: S.attr(core.class.ArrayOf, {
      of: S.newInstance(core.class.RefTo, { to: core.class.Doc })
    })
  })

  S.createClass(core.class.VDoc, core.class.Doc, {
    _space: S.attr(core.class.Type, {}),
    _createdOn: S.attr(core.class.Type, {}),
    _createdBy: S.attr(core.class.Type, {}),
    _modifiedOn: S.attr(core.class.Type, {}),
    _modifiedBy: S.attr(core.class.Type, {}),

    toStr: S.attr(core.class.ESFunc, {
      _default: 'title' as EasyScript<() => string>
    })
  })

  S.createClass(core.class.Attribute, core.class.Emb, {
    type: S.attr(core.class.Type, {})
  })

  S.createClass(core.class.Type, core.class.Emb, {
    _default: S.attr(core.class.Type, {})
  })

  S.createClass(core.class.ESFunc, core.class.Type, {
  })

  S.createClass(core.class.RefTo, core.class.Type, {
    to: S.attr(core.class.Type, {})
  })

  S.createClass(core.class.Classifier, core.class.Doc, {
    _kind: S.attr(core.class.Type, {}),
    _extends: S.attr(core.class.RefTo, {
      to: core.class.Class
    }),
    _attributes: S.attr(core.class.BagOf, {
      of: S.newInstance(core.class.InstanceOf, { of: core.class.Type })
    })
  })

  S.createClass(core.class.Class, core.class.Classifier, {
    _native: S.attr(core.class.Type, {}),
    _domain: S.attr(core.class.Type, {})
  }, CoreDomain.Model)

  S.createClass(core.class.Mixin, core.class.Class, {
  }, CoreDomain.Model)

  S.createClass(core.class.Space, core.class.Doc, {
  }, CoreDomain.Model)

  S.createClass(core.class.Tx, core.class.Doc, {
    _objectClass: S.attr(core.class.RefTo, { to: core.class.Class }),
    _objectId: S.attr(core.class.Type, {}),
    _date: S.attr(core.class.Type, {}),
    _user: S.attr(core.class.Type, {}),
  }, CoreDomain.Tx)

  S.createClass(core.class.CreateTx, core.class.Tx, {
    _space: S.attr(core.class.Type, {}),
    _attributes: S.attr(core.class.BagOf, {
      of: S.newInstance(core.class.InstanceOf, { of: core.class.Type })
    })
  }, CoreDomain.Tx)

  S.createClass(core.class.DeleteTx, core.class.Tx, {
  }, CoreDomain.Tx)


}
