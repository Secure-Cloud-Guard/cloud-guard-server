
export enum BucketType {
    PersonalVault = 'personal-vault',
    Storage = 'storage',
}

export interface BucketObject {
    name: string,
    url: string,
    size: number,
    lastModified?: Date,
    ownerId: string,
    owner: boolean,
    isFolder: boolean,
    shadowFolder?: boolean,
    sharing?: BucketObjectSharing,
    children?: BucketObject[]
}

export interface BucketObjectSharing {
    shared: boolean,
    shareWith?: ShareWithUser[],
}

export interface ShareWithUser {
    userId: string,
    userEmail: string,
    rights: AccessRights,
}

export enum AccessRights {
    Read = 'read',
    Write = 'write',
}