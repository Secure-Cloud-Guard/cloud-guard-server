
export interface BucketObject {
    name: string,
    url: string,
    size: number,
    lastModified?: Date,
    isFolder: boolean,
    children?: BucketObject[]
}