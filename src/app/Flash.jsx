import { useEffect, useRef, useState } from 'react'

import { FlashManager, StepCode, ErrorCode } from '../utils/manager'
import { useImageManager } from '../utils/image'
import { isLinux } from '../utils/platform'
import config from '../config'

import bolt from '../assets/bolt.svg'
import cable from '../assets/cable.svg'
import deviceExclamation from '../assets/device_exclamation_c3.svg'
import deviceQuestion from '../assets/device_question_c3.svg'
import done from '../assets/done.svg'
import exclamation from '../assets/exclamation.svg'
import systemUpdate from '../assets/system_update_c3.svg'


const steps = {
  [StepCode.INITIALIZING]: {
    status: 'Initializing...',
    bgColor: 'bg-gray-400 dark:bg-gray-700',
    icon: bolt,
  },
  [StepCode.READY]: {
    status: 'Tap to start',
    bgColor: 'bg-[#51ff00]',
    icon: bolt,
    iconStyle: '',
  },
  [StepCode.CONNECTING]: {
    status: 'Waiting for connection',
    description: 'Follow the instructions to connect your device to your computer',
    bgColor: 'bg-yellow-500',
    icon: cable,
  },
  [StepCode.REPAIR_PARTITION_TABLES]: {
    status: 'Repairing partition tables...',
    description: 'Do not unplug your device until the process is complete',
    bgColor: 'bg-lime-400',
    icon: systemUpdate,
  },
  [StepCode.ERASE_DEVICE]: {
    status: 'Erasing device...',
    description: 'Do not unplug your device until the process is complete',
    bgColor: 'bg-lime-400',
    icon: systemUpdate,
  },
  [StepCode.FLASH_SYSTEM]: {
    status: 'Flashing device...',
    description: 'Do not unplug your device until the process is complete',
    bgColor: 'bg-lime-400',
    icon: systemUpdate,
  },
  [StepCode.FINALIZING]: {
    status: 'Finalizing...',
    description: 'Do not unplug your device until the process is complete',
    bgColor: 'bg-lime-400',
    icon: systemUpdate,
  },
  [StepCode.DONE]: {
    status: 'Done',
    description: 'Your device was flashed successfully. It should now boot into the openpilot setup.',
    bgColor: 'bg-green-500',
    icon: done,
  },
}

const errors = {
  [ErrorCode.UNKNOWN]: {
    status: 'Unknown error',
    description: 'An unknown error has occurred. Unplug your device, restart your browser and try again.',
    bgColor: 'bg-red-500',
    icon: exclamation,
  },
  [ErrorCode.REQUIREMENTS_NOT_MET]: {
    status: 'Requirements not met',
    description: 'Your system does not meet the requirements to flash your device. Make sure to use a browser which ' +
      'supports WebUSB and is up to date.',
  },
  [ErrorCode.STORAGE_SPACE]: {
    description: 'Your system does not have enough space available to download AGNOS. Your browser may be restricting' +
      ' the available space if you are in a private, incognito or guest session.',
  },
  [ErrorCode.UNRECOGNIZED_DEVICE]: {
    status: 'Unrecognized device',
    description: 'The device connected to your computer is not supported. Try using a different cable, USB port, or ' +
      'computer. If the problem persists, join the #hw-three-3x channel on Discord for help.',
    bgColor: 'bg-yellow-500',
    icon: deviceQuestion,
  },
  [ErrorCode.LOST_CONNECTION]: {
    status: 'Lost connection',
    description: 'The connection to your device was lost. Unplug your device and try again.',
    icon: cable,
  },
  [ErrorCode.REPAIR_PARTITION_TABLES_FAILED]: {
    status: 'Repairing partition tables failed',
    description: 'Your device\'s partition tables could not be repaired. Try using a different cable, USB port, or ' +
      'computer. If the problem persists, join the #hw-three-3x channel on Discord for help.',
    icon: deviceExclamation,
  },
  [ErrorCode.ERASE_FAILED]: {
    status: 'Erase failed',
    description: 'The device could not be erased. Try using a different cable, USB port, or computer. If the problem ' +
      'persists, join the #hw-three-3x channel on Discord for help.',
    icon: deviceExclamation,
  },
  [ErrorCode.FLASH_SYSTEM_FAILED]: {
    status: 'Flash failed',
    description: 'AGNOS could not be flashed to your device. Try using a different cable, USB port, or computer. If ' +
      'the problem persists, join the #hw-three-3x channel on Discord for help.',
    icon: deviceExclamation,
  },
}

if (isLinux) {
  // this is likely in StepCode.CONNECTING
  errors[ErrorCode.LOST_CONNECTION].description += ' Did you forget to unbind the device from qcserial?'
}


function LinearProgress({ value, barColor }) {
  if (value === -1 || value > 100) value = 100
  return (
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`absolute top-0 bottom-0 left-0 w-full transition-all ${barColor}`}
        style={{ transform: `translateX(${value - 100}%)` }}
      />
    </div>
  )
}


function DeviceState({ serial }) {
  return (
    <div
      className="absolute bottom-0 m-0 lg:m-4 p-4 w-full sm:w-auto sm:min-w-[350px] sm:border sm:border-gray-200 dark:sm:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white rounded-md flex flex-row gap-2"
      style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <div className="flex flex-row gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 96 960 960"
          className="text-green-500 dark:text-[#51ff00]"
          height="24"
          width="24"
        >
          <path
            fill="currentColor"
            d="M480 976q-32 0-52-20t-20-52q0-22 11-40t31-29V724H302q-24 0-42-18t-18-42V555q-20-9-31-26.609-11-17.608-11-40.108Q200 456 220 436t52-20q32 0 52 20t20 52.411Q344 511 333 528.5T302 555v109h148V324h-80l110-149 110 149h-80v340h148V560h-42V416h144v144h-42v104q0 24-18 42t-42 18H510v111q19.95 10.652 30.975 29.826Q552 884 552 904q0 32-20 52t-52 20Z"
          />
        </svg>
        Device connected
      </div>
      <span className="text-gray-400">|</span>
      <div className="flex flex-row gap-2">
        <span>
          Serial:
          <span className="ml-2 font-mono">{serial || 'unknown'}</span>
        </span>
      </div>
    </div>
  )
}


function beforeUnloadListener(event) {
  // NOTE: not all browsers will show this message
  event.preventDefault()
  return (event.returnValue = "Flash in progress. Are you sure you want to leave?")
}


export default function Flash() {
  const [step, setStep] = useState(StepCode.INITIALIZING)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(-1)
  const [error, setError] = useState(ErrorCode.NONE)
  const [connected, setConnected] = useState(false)
  const [serial, setSerial] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(() => {
    return config.versions.find(v => v.isLatest) || config.versions[0]
  })

  const qdlManager = useRef(null)
  const imageManager = useImageManager()

  useEffect(() => {
    if (!imageManager.current) return

    fetch(config.loader.url)
      .then((res) => res.arrayBuffer())
      .then((programmer) => {
        // Create QDL manager with callbacks that update React state
        qdlManager.current = new FlashManager(selectedVersion.manifest, programmer, {
          onStepChange: setStep,
          onMessageChange: setMessage,
          onProgressChange: setProgress,
          onErrorChange: setError,
          onConnectionChange: setConnected,
          onSerialChange: setSerial
        })

        // Initialize the manager
        return qdlManager.current.initialize(imageManager.current)
      })
      .catch((err) => {
        console.error('Error initializing Flash manager:', err)
        setError(ErrorCode.UNKNOWN)
      })
  }, [selectedVersion.manifest, imageManager.current])

  // Handle user clicking the start button
  const handleStart = () => qdlManager.current?.start()
  const canStart = step === StepCode.READY && !error

  // Handle retry on error
  const handleRetry = () => window.location.reload()

  const uiState = steps[step]
  if (error) {
    Object.assign(uiState, errors[ErrorCode.UNKNOWN], errors[error])
  }
  const { status, description, bgColor, icon, iconStyle = 'invert' } = uiState

  let title
  if (message && !error) {
    title = message + '...'
    if (progress >= 0) {
      title += ` (${(progress * 100).toFixed(0)}%)`
    }
  } else if (error === ErrorCode.STORAGE_SPACE) {
    title = message
  } else {
    title = status
  }

  // warn the user if they try to leave the page while flashing
  if (step >= StepCode.REPAIR_PARTITION_TABLES && step <= StepCode.FINALIZING) {
    window.addEventListener("beforeunload", beforeUnloadListener, { capture: true })
  } else {
    window.removeEventListener("beforeunload", beforeUnloadListener, { capture: true })
  }

  // Handle version change
  const handleVersionChange = (event) => {
    const newVersion = config.versions.find(v => v.id === event.target.value)
    if (newVersion && step === StepCode.READY) {
      setSelectedVersion(newVersion)
    }
  }

  const canChangeVersion = step === StepCode.READY || step === StepCode.INITIALIZING

  return (
    <div id="flash" className="relative flex flex-col gap-8 justify-center items-center h-full">
      {canChangeVersion && (
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="version-select" className="text-sm dark:text-gray-300 font-medium">
            AGNOS Version
          </label>
          <select
            id="version-select"
            value={selectedVersion.id}
            onChange={handleVersionChange}
            disabled={step === StepCode.INITIALIZING}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {config.versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div
        className={`p-8 rounded-full ${bgColor}`}
        style={{ cursor: canStart ? 'pointer' : 'default' }}
        onClick={canStart ? handleStart : null}
      >
        <img
          src={icon}
          alt="cable"
          width={128}
          height={128}
          className={`${iconStyle} ${!error && step !== StepCode.DONE ? 'animate-pulse' : ''}`}
        />
      </div>
      <div className="w-full max-w-3xl px-8 transition-opacity duration-300" style={{ opacity: progress === -1 ? 0 : 1 }}>
        <LinearProgress value={progress * 100} barColor={bgColor} />
      </div>
      <span className="text-3xl dark:text-white font-mono font-light">{title}</span>
      <span className="text-xl dark:text-white px-8 max-w-xl">{description}</span>
      {error && (
        <button
          className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
          onClick={handleRetry}
        >
          Retry
        </button>
      ) || false}
      {connected && <DeviceState serial={serial} />}
    </div>
  )
}
