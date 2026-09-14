import type { Dimension } from '@minecraft/server'
import { Zone } from '../generation/Zone'
import { Region } from '../classes/Region'

declare global {
  interface ChunkCoordinate {
    x: number
    z: number
  }

  interface Vector3 {
    x: number
    y: number
    z: number
  }

  interface DimensionLocation {
    x: number
    y: number
    z: number
    dimension: Dimension
  }

  interface SplittingRules {
    minPartitionSize: Vector3
    maxPartitionSize: Vector3
    splitChance: number
    gap: number
  }

  interface SubzoneRules {
    minimumDepth?: number
    forcedDepth?: number
    chance: number
    selectionDepth?: number
  }

  interface ZoneConstraints {
    minSize: { x: number; z: number }
    maxSize: { x: number; z: number }
    /**Aspect ratio is x / z */
    aspectRatio?: number
  }

  interface SubzoneType {
    typeId: string
    weight?: number
  }

  interface SplitResult {
    regions: Region[]
    separator?: Region
  }

  interface ValueRange {
    min: number
    max: number
  }

  interface ZoneCandidate {
    type: typeof Zone
    splitRanges:
      | {
          x: ValueRange | undefined
          z: ValueRange | undefined
        }
      | undefined
  }

  type Axis = 'x' | 'z'
}
